import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { normalizeTemplateConfig } from '../templates/defaults.js';
import { PUBLIC_OWNER_SELECT, publicOwner } from '../templates/publicOwner.js';

/**
 * Galeri template publik.
 *
 * Berbeda dari /api/share (tautan/kode yang harus dibagikan langsung),
 * galeri menampilkan template yang sengaja diterbitkan pemiliknya agar bisa
 * ditemukan semua orang. GET bersifat publik; menyalin ke akun wajib login.
 */
export const galleryRouter = Router();

const ownerSelect = { select: PUBLIC_OWNER_SELECT };

function publicTemplate(template, { withLogo = true } = {}) {
  const config = normalizeTemplateConfig(JSON.parse(template.config));
  // Daftar galeri bisa berisi hingga 100 template; logo cover (maks 1,4 MB
  // sebagai data URL) hanya dikirim pada endpoint detail agar response tidak
  // membengkak menjadi ratusan MB.
  if (!withLogo && config.cover) config.cover.logo = '';
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    config,
    publishedAt: template.publishedAt,
    ...publicOwner(template.owner),
  };
}

async function uniqueName(ownerId, baseName) {
  const taken = new Set(
    (
      await prisma.formatTemplate.findMany({
        where: { ownerId, name: { startsWith: baseName } },
        select: { name: true },
      })
    ).map((template) => template.name),
  );
  if (!taken.has(baseName)) return baseName;
  let number = 2;
  while (taken.has(`${baseName} (${number})`)) number += 1;
  return `${baseName} (${number})`;
}

galleryRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = String(req.query.q || '').trim().slice(0, 80);
    const category = String(req.query.category || '').trim().slice(0, 80);
    const where = {
      isPublished: true,
      isSystem: false,
      ...(category ? { category } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query } },
              { description: { contains: query } },
              { category: { contains: query } },
            ],
          }
        : {}),
    };
    const [templates, categoryRows] = await Promise.all([
      prisma.formatTemplate.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { name: 'asc' }],
        take: 100,
        include: { owner: ownerSelect },
      }),
      prisma.formatTemplate.findMany({
        where: { isPublished: true, isSystem: false },
        select: { category: true },
      }),
    ]);
    const categories = [...new Set(categoryRows.map((row) => row.category))].sort((a, b) => a.localeCompare(b, 'id'));
    res.set('Cache-Control', 'no-store');
    res.json({ templates: templates.map((template) => publicTemplate(template, { withLogo: false })), categories });
  }),
);

galleryRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const template = await prisma.formatTemplate.findFirst({
      where: { id: req.params.id, isPublished: true, isSystem: false },
      include: { owner: ownerSelect },
    });
    if (!template) throw new HttpError(404, 'Template galeri tidak ditemukan atau sudah tidak dipublikasikan.');
    res.set('Cache-Control', 'no-store');
    res.json({ template: publicTemplate(template) });
  }),
);

galleryRouter.post(
  '/:id/use',
  authenticate,
  asyncHandler(async (req, res) => {
    const source = await prisma.formatTemplate.findFirst({
      where: { id: req.params.id, isPublished: true, isSystem: false },
    });
    if (!source) throw new HttpError(404, 'Template galeri tidak ditemukan atau sudah tidak dipublikasikan.');
    const name = await uniqueName(req.user.id, source.name);
    const template = await prisma.formatTemplate.create({
      data: {
        name,
        description: source.description,
        category: source.category,
        isSystem: false,
        ownerId: req.user.id,
        config: JSON.stringify(normalizeTemplateConfig(JSON.parse(source.config))),
        importedFrom: `gallery:${source.id}`,
      },
    });
    await prisma.activity.create({
      data: { userId: req.user.id, type: 'template', message: `Template “${name}” disalin dari galeri publik` },
    });
    res.status(201).json({
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        config: normalizeTemplateConfig(JSON.parse(template.config)),
      },
    });
  }),
);
