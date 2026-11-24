import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { singleDocxUpload } from '../middleware/upload.js';
import { validateDocxBuffer } from '../lib/docxValidation.js';
import { deleteStored, downloadName, readStored, saveUpload, writeProcessed } from '../lib/storage.js';
import { pagination, parseJson, safeFileName, toJson } from '../lib/utils.js';
import { resolveFormatConfig } from '../lib/templateConfig.js';
import { analyzeDocument } from '../docx/checker.js';
import { formatDocument } from '../docx/format.js';
import { createPreview } from '../docx/preview.js';
import { buildDocxFromText } from '../docx/fromText.js';
import { formatRequestSchema } from '../validation/schemas.js';
import { config as appConfig } from '../config.js';

export const documentsRouter = Router();
documentsRouter.use(authenticate);

function serialize(doc, full = false) {
  const base = {
    id: doc.id,
    originalName: doc.originalName,
    size: doc.size,
    status: doc.status,
    templateId: doc.templateId,
    templateName: doc.template?.name || null,
    pageCount: doc.pageCount,
    processedName: doc.processedName,
    processedSize: doc.processedSize,
    processedAt: doc.processedAt,
    errorMessage: doc.errorMessage,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
  if (!full) return base;
  return {
    ...base,
    config: parseJson(doc.config, null),
    options: parseJson(doc.options, null),
    issues: parseJson(doc.issues, null),
    headings: parseJson(doc.headings, null),
    stats: parseJson(doc.stats, null),
  };
}

async function getOwnedDocument(req) {
  const doc = await prisma.document.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { template: { select: { id: true, name: true } } },
  });
  if (!doc) throw new HttpError(404, 'Dokumen tidak ditemukan.');
  return doc;
}

function logActivity(userId, type, message, documentId) {
  return prisma.activity.create({ data: { userId, type, message, documentId } }).catch(() => null);
}

documentsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query);
    const q = String(req.query.q || '').trim();
    const status = String(req.query.status || '').trim();
    const where = {
      userId: req.user.id,
      ...(q ? { originalName: { contains: q } } : {}),
      ...(status && ['uploaded', 'processing', 'ready', 'failed'].includes(status) ? { status } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: { template: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);
    res.json({ documents: items.map((d) => serialize(d)), page, limit, total, totalPages: Math.ceil(total / limit) });
  }),
);

documentsRouter.post(
  '/',
  (req, res, next) => {
    singleDocxUpload(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: `Ukuran file melebihi batas ${appConfig.maxUploadMb} MB.` });
        }
        return res.status(400).json({ error: err.message || 'Upload gagal.' });
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'File DOCX wajib diunggah.');
    const validation = await validateDocxBuffer(req.file.buffer);
    if (!validation.ok) throw new HttpError(422, validation.reason);

    const originalName = String(req.file.originalname || 'dokumen.docx')
      .replace(/^.*[\\/]/, '')
      .replace(/[\u0000-\u001f]/g, '')
      .slice(0, 180)
      .normalize('NFC');
    const storedName = await saveUpload(req.user.id, req.file.buffer);
    const doc = await prisma.document.create({
      data: {
        userId: req.user.id,
        originalName: originalName || 'dokumen.docx',
        storedName,
        mimeType: req.file.mimetype || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: req.file.size,
        status: 'uploaded',
      },
      include: { template: { select: { name: true } } },
    });
    await logActivity(req.user.id, 'upload', `Dokumen “${doc.originalName}” diunggah`, doc.id);
    res.status(201).json({ document: serialize(doc, true) });
  }),
);

documentsRouter.post(
  '/text',
  asyncHandler(async (req, res) => {
    const text = typeof req.body?.text === 'string' ? req.body.text : '';
    if (text.trim().length < 20) throw new HttpError(400, 'Teks terlalu pendek. Tempel isi makalah terlebih dahulu.');
    if (text.length > 500000) throw new HttpError(413, 'Teks terlalu panjang (maksimum 500.000 karakter).');
    let buffer;
    try {
      buffer = await buildDocxFromText(text);
    } catch (e) {
      throw new HttpError(422, e.message || 'Teks tidak dapat dikonversi.');
    }
    const titleLine = text.split('\n').map((l) => l.replace(/^#+\s*|\*\*|__/g, '').trim()).find(Boolean) || 'Makalah';
    const base = safeFileName(String(req.body?.title || titleLine).slice(0, 80)) || 'makalah';
    const storedName = await saveUpload(req.user.id, buffer);
    const doc = await prisma.document.create({
      data: {
        userId: req.user.id,
        originalName: `${base}.docx`,
        storedName,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: buffer.length,
        status: 'uploaded',
      },
      include: { template: { select: { name: true } } },
    });
    await logActivity(req.user.id, 'upload', `Dokumen “${doc.originalName}” dibuat dari teks`, doc.id);
    res.status(201).json({ document: serialize(doc, true) });
  }),
);

documentsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await getOwnedDocument(req);
    res.json({ document: serialize(doc, true) });
  }),
);

documentsRouter.get(
  '/:id/preview',
  asyncHandler(async (req, res) => {
    // A processed preview changes in place each time the user applies
    // formatting. Never let the browser reuse a response for the stable URL.
    res.set('Cache-Control', 'private, no-store');
    const doc = await getOwnedDocument(req);
    const variant = req.query.variant === 'processed' ? 'processed' : 'original';
    if (variant === 'processed' && !doc.processedName) {
      throw new HttpError(404, 'Dokumen hasil belum tersedia. Jalankan formatting terlebih dahulu.');
    }
    let templateConfigValue = parseJson(doc.config, null);
    if (req.query.templateId) {
      const resolved = await resolveFormatConfig({ templateId: String(req.query.templateId), userId: req.user.id });
      templateConfigValue = resolved.config;
    }
    if (!templateConfigValue) {
      const resolved = await resolveFormatConfig({ templateId: doc.templateId || undefined, userId: req.user.id });
      templateConfigValue = resolved.config;
    }
    const buffer = await readStored(req.user.id, variant === 'processed' ? doc.processedName : doc.storedName);
    const preview = await createPreview(buffer, templateConfigValue, variant, parseJson(doc.options, {}));
    res.json({
      preview,
      document: { id: doc.id, originalName: doc.originalName, status: doc.status },
    });
  }),
);

documentsRouter.post(
  '/:id/analyze',
  asyncHandler(async (req, res) => {
    const doc = await getOwnedDocument(req);
    const { templateId, config: providedConfig, options } = formatRequestSchema.partial().parse(req.body || {});
    const resolved = await resolveFormatConfig({
      templateId: templateId ?? doc.templateId ?? undefined,
      config: providedConfig,
      userId: req.user.id,
    });
    const variant = req.body?.variant === 'processed' && doc.processedName ? 'processed' : 'original';
    if (variant === 'processed' && !doc.processedName) throw new HttpError(404, 'Dokumen hasil belum tersedia.');
    const buffer = await readStored(req.user.id, variant === 'processed' ? doc.processedName : doc.storedName);
    const analysis = await analyzeDocument(buffer, resolved.config);

    await prisma.document.update({
      where: { id: doc.id },
      data: {
        issues: toJson(analysis),
        headings: toJson(analysis.headings),
        stats: toJson(analysis.stats),
        templateId: resolved.template?.id || doc.templateId,
        ...(providedConfig ? { config: toJson(resolved.config) } : {}),
        ...(options ? { options: toJson(options) } : {}),
      },
    });

    res.json({
      analysis,
      variant,
      template: resolved.template ? { id: resolved.template.id, name: resolved.template.name } : null,
      config: resolved.config,
    });
  }),
);

documentsRouter.post(
  '/:id/live-preview',
  asyncHandler(async (req, res) => {
    const doc = await getOwnedDocument(req);
    const input = formatRequestSchema.parse(req.body || {});
    const resolved = await resolveFormatConfig({
      templateId: input.templateId ?? doc.templateId ?? undefined,
      config: input.config,
      userId: req.user.id,
    });
    const source = await readStored(req.user.id, doc.storedName);
    let result;
    try {
      result = await formatDocument(source, {
        config: resolved.config,
        options: input.options,
        boundaries: input.boundaries || null,
        meta: input.meta || {},
        includeToc: input.options.toc && resolved.config.toc.enabled,
      });
    } catch (error) {
      throw new HttpError(422, `Preview gagal: ${error.message}`);
    }
    const preview = await createPreview(result.buffer, resolved.config, 'processed', input.options);
    res.json({ preview, report: result.report });
  }),
);

documentsRouter.post(
  '/:id/format',
  asyncHandler(async (req, res) => {
    const doc = await getOwnedDocument(req);
    const input = formatRequestSchema.parse(req.body || {});
    const resolved = await resolveFormatConfig({
      templateId: input.templateId ?? doc.templateId ?? undefined,
      config: input.config,
      userId: req.user.id,
    });

    await prisma.document.update({ where: { id: doc.id }, data: { status: 'processing', errorMessage: null } });

    try {
      const source = await readStored(req.user.id, doc.storedName);
      const result = await formatDocument(source, {
        config: resolved.config,
        options: input.options,
        boundaries: input.boundaries || null,
        meta: input.meta || {},
        includeToc: input.options.toc && resolved.config.toc.enabled,
      });
      const processedName = await writeProcessed(req.user.id, doc.storedName, result.buffer);
      let analysis = null;
      try {
        analysis = await analyzeDocument(result.buffer, resolved.config);
      } catch (error) {
        console.warn('[paperly] Analisis hasil gagal:', error.message);
      }

      const updated = await prisma.document.update({
        where: { id: doc.id },
        data: {
          status: 'ready',
          processedName,
          processedSize: result.buffer.length,
          processedAt: new Date(),
          templateId: resolved.template?.id || doc.templateId,
          config: toJson(resolved.config),
          options: toJson(input.options),
          issues: analysis ? toJson(analysis) : null,
          headings: toJson(result.report.headings),
          stats: toJson(result.report.stats),
          pageCount: result.report.stats.pageCount,
          errorMessage: null,
        },
        include: { template: { select: { name: true } } },
      });
      await logActivity(req.user.id, 'format', `Dokumen “${doc.originalName}” dirapikan`, doc.id);
      res.json({
        document: serialize(updated, true),
        report: result.report,
        analysis,
        template: resolved.template ? { id: resolved.template.id, name: resolved.template.name } : null,
        config: resolved.config,
      });
    } catch (error) {
      await prisma.document.update({
        where: { id: doc.id },
        data: { status: 'failed', errorMessage: error.message?.slice(0, 500) || 'Pemrosesan gagal.' },
      });
      throw new HttpError(422, `Dokumen gagal diproses: ${error.message}`);
    }
  }),
);

documentsRouter.post(
  '/:id/reset',
  asyncHandler(async (req, res) => {
    const doc = await getOwnedDocument(req);
    if (doc.processedName) await deleteStored(req.user.id, doc.processedName);
    const updated = await prisma.document.update({
      where: { id: doc.id },
      data: { processedName: null, processedSize: null, processedAt: null, status: 'uploaded', errorMessage: null },
      include: { template: { select: { name: true } } },
    });
    await logActivity(req.user.id, 'delete', `Hasil formatting “${doc.originalName}” dibatalkan`, doc.id);
    res.json({ document: serialize(updated, true) });
  }),
);

documentsRouter.get(
  '/:id/download',
  asyncHandler(async (req, res) => {
    const doc = await getOwnedDocument(req);
    const variant = req.query.variant === 'original' ? 'original' : 'processed';
    const storedName = variant === 'processed' ? doc.processedName : doc.storedName;
    if (!storedName) throw new HttpError(404, 'File hasil belum tersedia.');
    const buffer = await readStored(req.user.id, storedName);
    const requested = String(req.query.name || '').trim();
    const baseName = requested ? safeFileName(requested) : safeFileName(doc.originalName);
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

documentsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await getOwnedDocument(req);
    await deleteStored(req.user.id, doc.storedName);
    if (doc.processedName) await deleteStored(req.user.id, doc.processedName);
    await prisma.document.delete({ where: { id: doc.id } });
    await logActivity(req.user.id, 'delete', `Dokumen “${doc.originalName}” dihapus`, null);
    res.json({ ok: true });
  }),
);
