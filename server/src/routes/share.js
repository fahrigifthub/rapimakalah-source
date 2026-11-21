import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { normalizeTemplateConfig } from '../templates/defaults.js';

/**
 * Berbagi template lewat tautan publik.
 *
 * Alur: pemilik template membuat kode berbagi, lalu membagikan
 * /t/<kode>. Siapa pun bisa melihat ringkasan
 * template tanpa login, dan pengguna yang login dapat menyimpan salinan
 * persis (config JSON disalin apa adanya) ke akunnya sendiri.
 *
 * Router ini sengaja tidak memakai authenticate global: GET harus publik.
 * Hanya endpoint impor yang mewajibkan login.
 */
export const shareRouter = Router();

function publicTemplate(template) {
  return {
    shareId: template.shareId,
    name: template.name,
    description: template.description,
    category: template.category,
    config: normalizeTemplateConfig(JSON.parse(template.config)),
    ownerName: template.owner?.name || 'Pengguna RapiMakalah',
    ownerInstitution: template.owner?.institution || null,
    ownerProgramStudy: template.owner?.programStudy || null,
    sharedAt: template.sharedAt,
    updatedAt: template.updatedAt,
  };
}

shareRouter.get(
  '/:shareId',
  asyncHandler(async (req, res) => {
    const template = await prisma.formatTemplate.findUnique({
      where: { shareId: req.params.shareId },
      include: { owner: { select: { name: true, institution: true, programStudy: true } } },
    });
    if (!template) throw new HttpError(404, 'Tautan template tidak ditemukan atau sudah dicabut pemiliknya.');
    res.json({ template: publicTemplate(template) });
  }),
);

/** Nama salinan yang belum dipakai pemilik, mis. "Skripsi UB (2)". */
async function uniqueName(ownerId, baseName) {
  const taken = new Set(
    (
      await prisma.formatTemplate.findMany({
        where: { ownerId, name: { startsWith: baseName } },
        select: { name: true },
      })
    ).map((t) => t.name),
  );
  if (!taken.has(baseName)) return baseName;
  let n = 2;
  while (taken.has(`${baseName} (${n})`)) n += 1;
  return `${baseName} (${n})`;
}

shareRouter.post(
  '/:shareId/import',
  authenticate,
  asyncHandler(async (req, res) => {
    const source = await prisma.formatTemplate.findUnique({ where: { shareId: req.params.shareId } });
    if (!source) throw new HttpError(404, 'Tautan template tidak ditemukan atau sudah dicabut pemiliknya.');

    const name = await uniqueName(req.user.id, source.name);
    const template = await prisma.formatTemplate.create({
      data: {
        name,
        description: source.description,
        category: source.category,
        isSystem: false,
        ownerId: req.user.id,
        config: JSON.stringify(normalizeTemplateConfig(JSON.parse(source.config))),
        importedFrom: source.shareId,
      },
    });
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        type: 'template',
        message: `Template “${name}” disimpan dari tautan berbagi`,
      },
    });
    res.status(201).json({
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        isSystem: template.isSystem,
        isOwned: true,
        config: normalizeTemplateConfig(JSON.parse(template.config)),
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      },
    });
  }),
);
