import { Router } from 'express';
import { randomInt } from 'node:crypto';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { normalizeTemplateConfig } from '../templates/defaults.js';
import { templateInputSchema } from '../validation/schemas.js';

export const templatesRouter = Router();
templatesRouter.use(authenticate);

/** Kode berbagi yang mudah diketik: tanpa 0/O/1/I/l yang sering tertukar. */
const SHARE_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';
function newShareCode() {
  let out = '';
  for (let i = 0; i < 8; i += 1) out += SHARE_ALPHABET[randomInt(SHARE_ALPHABET.length)];
  return out;
}

function serialize(template, usageCount = 0) {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    isSystem: template.isSystem,
    isOwned: Boolean(template.ownerId),
    shareId: template.shareId || null,
    importedFrom: template.importedFrom || null,
    config: normalizeTemplateConfig(JSON.parse(template.config)),
    usageCount,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

templatesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const templates = await prisma.formatTemplate.findMany({
      // Fokus sementara pada Makalah; template lain tetap tersedia lewat ID
      // agar dokumen lama yang menggunakannya tetap bisa dibuka.
      where: { OR: [{ isSystem: true, name: 'Makalah' }, { ownerId: req.user.id }] },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
    const usage = await prisma.document.groupBy({
      by: ['templateId'],
      where: { userId: req.user.id, templateId: { not: null } },
      _count: { _all: true },
    });
    const usageMap = new Map(usage.map((u) => [u.templateId, u._count._all]));
    res.json({ templates: templates.map((t) => serialize(t, usageMap.get(t.id) || 0)) });
  }),
);

templatesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const template = await prisma.formatTemplate.findFirst({
      where: { id: req.params.id, OR: [{ isSystem: true }, { ownerId: req.user.id }] },
    });
    if (!template) throw new HttpError(404, 'Template tidak ditemukan.');
    res.json({ template: serialize(template) });
  }),
);

templatesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = templateInputSchema.parse(req.body);
    const template = await prisma.formatTemplate.create({
      data: {
        name: data.name,
        description: data.description || null,
        category: data.category,
        isSystem: false,
        ownerId: req.user.id,
        config: JSON.stringify(normalizeTemplateConfig(data.config)),
      },
    });
    await prisma.activity.create({
      data: { userId: req.user.id, type: 'template', message: `Template “${template.name}” dibuat` },
    });
    res.status(201).json({ template: serialize(template) });
  }),
);

templatesRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.formatTemplate.findFirst({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, 'Template tidak ditemukan.');
    if (existing.isSystem) throw new HttpError(403, 'Template bawaan tidak dapat diubah. Duplikat terlebih dahulu untuk membuat versi kustom.');
    if (existing.ownerId !== req.user.id) throw new HttpError(403, 'Anda tidak berhak mengubah template ini.');
    const data = templateInputSchema.parse(req.body);
    const template = await prisma.formatTemplate.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        description: data.description || null,
        category: data.category,
        config: JSON.stringify(normalizeTemplateConfig(data.config)),
      },
    });
    await prisma.activity.create({
      data: { userId: req.user.id, type: 'template', message: `Template “${template.name}” diperbarui` },
    });
    res.json({ template: serialize(template) });
  }),
);

templatesRouter.post(
  '/:id/duplicate',
  asyncHandler(async (req, res) => {
    const source = await prisma.formatTemplate.findFirst({
      where: { id: req.params.id, OR: [{ isSystem: true }, { ownerId: req.user.id }] },
    });
    if (!source) throw new HttpError(404, 'Template tidak ditemukan.');
    const template = await prisma.formatTemplate.create({
      data: {
        name: `${source.name} (kustom)`,
        description: source.description,
        category: source.category,
        isSystem: false,
        ownerId: req.user.id,
        config: source.config,
      },
    });
    await prisma.activity.create({
      data: { userId: req.user.id, type: 'template', message: `Template “${source.name}” diduplikasi` },
    });
    res.status(201).json({ template: serialize(template) });
  }),
);

templatesRouter.post(
  '/:id/share',
  asyncHandler(async (req, res) => {
    const template = await prisma.formatTemplate.findFirst({ where: { id: req.params.id } });
    if (!template) throw new HttpError(404, 'Template tidak ditemukan.');
    if (template.isSystem) throw new HttpError(403, 'Template bawaan tidak perlu dibagikan; semua pengguna sudah memilikinya.');
    if (template.ownerId !== req.user.id) throw new HttpError(403, 'Anda hanya dapat membagikan template milik sendiri.');

    if (template.shareId) {
      return res.json({ shareId: template.shareId, sharedAt: template.sharedAt });
    }

    // Ulangi bila kode kebetulan bentrok dengan template lain.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const shareId = newShareCode();
      try {
        const updated = await prisma.formatTemplate.update({
          where: { id: template.id },
          data: { shareId, sharedAt: new Date() },
        });
        await prisma.activity.create({
          data: { userId: req.user.id, type: 'template', message: `Template “${template.name}” dibagikan` },
        });
        return res.status(201).json({ shareId: updated.shareId, sharedAt: updated.sharedAt });
      } catch (err) {
        if (err?.code !== 'P2002') throw err;
      }
    }
    throw new HttpError(500, 'Gagal membuat kode berbagi. Coba lagi.');
  }),
);

templatesRouter.delete(
  '/:id/share',
  asyncHandler(async (req, res) => {
    const template = await prisma.formatTemplate.findFirst({ where: { id: req.params.id } });
    if (!template) throw new HttpError(404, 'Template tidak ditemukan.');
    if (template.ownerId !== req.user.id) throw new HttpError(403, 'Anda hanya dapat mencabut tautan template milik sendiri.');
    await prisma.formatTemplate.update({
      where: { id: template.id },
      data: { shareId: null, sharedAt: null },
    });
    await prisma.activity.create({
      data: { userId: req.user.id, type: 'template', message: `Tautan berbagi “${template.name}” dicabut` },
    });
    res.json({ ok: true });
  }),
);

templatesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const template = await prisma.formatTemplate.findFirst({ where: { id: req.params.id } });
    if (!template) throw new HttpError(404, 'Template tidak ditemukan.');
    if (template.isSystem) throw new HttpError(403, 'Template bawaan tidak dapat dihapus.');
    if (template.ownerId !== req.user.id) throw new HttpError(403, 'Anda tidak berhak menghapus template ini.');
    await prisma.formatTemplate.delete({ where: { id: template.id } });
    await prisma.activity.create({
      data: { userId: req.user.id, type: 'template', message: `Template “${template.name}” dihapus` },
    });
    res.json({ ok: true });
  }),
);
