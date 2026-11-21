import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { pagination, parseJson, safeFileName } from '../lib/utils.js';
import { readStored } from '../lib/storage.js';
import { resolveFormatConfig } from '../lib/templateConfig.js';
import { createPreview } from '../docx/previewRepaired.js';

export const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(requireAdmin);

adminRouter.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const [totalUsers, totalDocs, storageBytes, processedDocs] = await Promise.all([
      prisma.user.count(),
      prisma.document.count(),
      prisma.document.aggregate({ _sum: { size: true, processedSize: true } }),
      prisma.document.count({ where: { processedName: { not: null } } }),
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const docsPerDay = await prisma.document.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    });

    const dayMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayMap[d.toISOString().slice(0, 10)] = 0;
    }
    for (const row of docsPerDay) {
      const key = row.createdAt.toISOString().slice(0, 10);
      if (key in dayMap) dayMap[key] += 1;
    }

    const templateStats = await prisma.document.groupBy({
      by: ['templateId'],
      _count: { _all: true },
      _sum: { size: true },
    });
    const templateIds = templateStats.map((r) => r.templateId).filter(Boolean);
    const templateNames = templateIds.length
      ? await prisma.formatTemplate.findMany({
          where: { id: { in: templateIds } },
          select: { id: true, name: true },
        })
      : [];
    const templateMap = new Map(templateNames.map((t) => [t.id, t.name]));
    const templates = templateStats
      .filter((r) => !r.templateId || templateMap.has(r.templateId))
      .map((r) => ({ name: r.templateId ? templateMap.get(r.templateId) : 'Tanpa template', count: r._count._all }))
      .sort((a, b) => b.count - a.count);

    const errorDocs = await prisma.document.count({ where: { status: 'failed' } });

    res.json({
      totalUsers,
      totalDocs,
      processedDocs,
      errorDocs,
      storageBytes: (storageBytes._sum.size || 0) + (storageBytes._sum.processedSize || 0),
      docsPerDay: Object.entries(dayMap).map(([date, count]) => ({ date, count })),
      templates: templates.slice(0, 10),
    });
  }),
);

adminRouter.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { search, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          institution: true,
          programStudy: true,
          createdAt: true,
          _count: { select: { documents: true, templates: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  }),
);

adminRouter.get(
  '/documents',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query);
    const q = String(req.query.q || '').trim();
    const status = String(req.query.status || '').trim();
    const userId = String(req.query.userId || '').trim();
    const where = {
      ...(q
        ? { OR: [{ originalName: { contains: q } }, { user: { email: { contains: q } } }, { user: { name: { contains: q } } }] }
        : {}),
      ...(status && ['uploaded', 'processing', 'ready', 'failed'].includes(status) ? { status } : {}),
      ...(userId ? { userId } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.document.findMany({
        where,
        select: {
          id: true,
          originalName: true,
          size: true,
          status: true,
          pageCount: true,
          processedSize: true,
          processedAt: true,
          processedName: true,
          createdAt: true,
          errorMessage: true,
          template: { select: { name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);
    res.json({
      documents: items.map((d) => ({
        id: d.id,
        originalName: d.originalName,
        size: d.size,
        status: d.status,
        pageCount: d.pageCount,
        processedSize: d.processedSize,
        processedAt: d.processedAt,
        hasProcessed: Boolean(d.processedName),
        createdAt: d.createdAt,
        errorMessage: d.errorMessage,
        templateName: d.template?.name || null,
        owner: d.user,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }),
);

async function findAnyDocument(id) {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) throw new HttpError(404, 'Dokumen tidak ditemukan.');
  return doc;
}

adminRouter.get(
  '/documents/:id/preview',
  asyncHandler(async (req, res) => {
    const doc = await findAnyDocument(req.params.id);
    const variant = req.query.variant === 'original' ? 'original' : 'processed';
    const storedName = variant === 'processed' ? doc.processedName : doc.storedName;
    if (!storedName) throw new HttpError(404, 'Dokumen hasil belum tersedia. Pengguna belum menjalankan formatting.');
    // Use the settings recorded on the document; the admin may not own their template.
    const config = parseJson(doc.config, null) || (await resolveFormatConfig({ userId: doc.userId })).config;
    const buffer = await readStored(doc.userId, storedName);
    const preview = await createPreview(buffer, config, variant, parseJson(doc.options, {}));
    res.json({
      preview,
      config,
      document: {
        id: doc.id,
        originalName: doc.originalName,
        status: doc.status,
        variant,
      },
    });
  }),
);

adminRouter.get(
  '/documents/:id/download',
  asyncHandler(async (req, res) => {
    const doc = await findAnyDocument(req.params.id);
    const variant = req.query.variant === 'original' ? 'original' : 'processed';
    const storedName = variant === 'processed' ? doc.processedName : doc.storedName;
    if (!storedName) throw new HttpError(404, 'File hasil belum tersedia.');
    const buffer = await readStored(doc.userId, storedName);
    const baseName = safeFileName(doc.originalName);
    const fileName = variant === 'processed' ? `${baseName}-rapimakalah.docx` : `${baseName}.docx`;
    const ascii = fileName.replace(/[^\x20-\x7E]/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${ascii.replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    res.send(buffer);
  }),
);

adminRouter.post(
  '/users/:id/reset-password',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new HttpError(404, 'Pengguna tidak ditemukan.');
    if (user.role === 'admin') throw new HttpError(400, 'Tidak dapat mereset password administrator.');

    const newPassword = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 9);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json({ ok: true, newPassword });
  }),
);

adminRouter.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new HttpError(404, 'Pengguna tidak ditemukan.');
    if (user.role === 'admin') throw new HttpError(400, 'Tidak dapat menghapus administrator.');

    await prisma.user.delete({ where: { id: user.id } });
    res.json({ ok: true });
  }),
);
