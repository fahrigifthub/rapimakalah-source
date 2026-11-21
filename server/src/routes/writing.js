import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { config } from '../config.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { exportWriting } from '../docx/writing.js';
import { singleDocxUpload } from '../middleware/upload.js';
import { validateDocxBuffer } from '../lib/docxValidation.js';
import { importWritingDocx } from '../docx/writingImport.js';

export const writingRouter = Router();
writingRouter.use(authenticate);
const schema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.object({ type: z.literal('doc'), content: z.array(z.unknown()).max(10000).optional() }).passthrough(),
});
const folder = (req) => path.join(config.storageDir, 'writing', req.user.id);
function filename(req) {
  if (!/^[a-f0-9-]{36}$/.test(req.params.id)) throw new HttpError(404, 'Draft tidak ditemukan.');
  return path.join(folder(req), `${req.params.id}.json`);
}
function originalFilename(req) {
  if (!/^[a-f0-9-]{36}$/.test(req.params.id)) throw new HttpError(404, 'Draft tidak ditemukan.');
  return path.join(folder(req), `${req.params.id}.original.docx`);
}
async function readDraft(req) {
  try { return JSON.parse(await fs.readFile(filename(req), 'utf8')); }
  catch (err) { if (err.code === 'ENOENT') throw new HttpError(404, 'Draft tidak ditemukan.'); throw err; }
}
writingRouter.get('/', asyncHandler(async (req, res) => {
  await fs.mkdir(folder(req), { recursive: true });
  const files = (await fs.readdir(folder(req))).filter(name => name.endsWith('.json'));
  const drafts = await Promise.all(files.map(async name => {
    const { content, ...summary } = JSON.parse(await fs.readFile(path.join(folder(req), name), 'utf8'));
    return summary;
  }));
  res.json({ drafts: drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) });
}));
writingRouter.post('/', asyncHandler(async (req, res) => {
  const data = schema.parse(req.body);
  const draft = { ...data, id: randomUUID(), updatedAt: new Date().toISOString() };
  await fs.mkdir(folder(req), { recursive: true });
  await fs.writeFile(path.join(folder(req), `${draft.id}.json`), JSON.stringify(draft), { flag: 'wx' });
  res.status(201).json({ draft });
}));
writingRouter.post('/import', (req, res, next) => singleDocxUpload(req, res, err => err ? next(new HttpError(400, err.message)) : next()), asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Pilih file Word .docx.');
  const validation = await validateDocxBuffer(req.file.buffer);
  if (!validation.ok) throw new HttpError(422, validation.reason);
  const { html, warnings, page } = await importWritingDocx(req.file.buffer);
  if (Buffer.byteLength(html) > 1500000) throw new HttpError(413, 'Isi Word terlalu besar untuk editor. Kurangi gambar lalu unggah ulang.');
  res.json({ html, warnings, page });
}));
writingRouter.post('/:id/original', (req, res, next) => singleDocxUpload(req, res, err => err ? next(new HttpError(400, err.message)) : next()), asyncHandler(async (req, res) => {
  const draft = await readDraft(req);
  if (!req.file) throw new HttpError(400, 'Pilih file Word .docx.');
  const validation = await validateDocxBuffer(req.file.buffer);
  if (!validation.ok) throw new HttpError(422, validation.reason);
  await fs.mkdir(folder(req), { recursive: true });
  await fs.writeFile(originalFilename(req), req.file.buffer, { mode: 0o600 });
  draft.originalDocx = true;
  draft.updatedAt = new Date().toISOString();
  const temporary = `${filename(req)}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, JSON.stringify(draft), { mode: 0o600 });
    await fs.rename(temporary, filename(req));
  } catch (err) {
    await fs.rm(originalFilename(req), { force: true });
    await fs.rm(temporary, { force: true });
    throw err;
  }
  res.json({ originalDocx: true });
}));
writingRouter.get('/:id/original', asyncHandler(async (req, res) => {
  await readDraft(req);
  try {
    res.type('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.set('Cache-Control', 'private, no-store');
    res.send(await fs.readFile(originalFilename(req)));
  } catch (err) {
    if (err.code === 'ENOENT') throw new HttpError(404, 'File Word asli tidak tersedia.');
    throw err;
  }
}));
writingRouter.get('/:id', asyncHandler(async (req, res) => res.json({ draft: await readDraft(req) })));
writingRouter.put('/:id', asyncHandler(async (req, res) => {
  const current = await readDraft(req);
  const data = schema.parse(req.body);
  const draft = { ...current, ...data, updatedAt: new Date().toISOString() };
  const temporary = `${filename(req)}.${randomUUID()}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(draft));
  await fs.rename(temporary, filename(req));
  res.json({ draft });
}));
writingRouter.delete('/:id', asyncHandler(async (req, res) => {
  await readDraft(req);
  await fs.unlink(filename(req));
  await fs.rm(originalFilename(req), { force: true });
  res.status(204).end();
}));
writingRouter.get('/:id/download', asyncHandler(async (req, res) => {
  const draft = await readDraft(req);
  const buffer = await exportWriting(draft.content);
  const name = draft.title.replace(/[\\/:*?"<>|\r\n]/g, '-').slice(0, 100) || 'Makalah';
  res.attachment(`${name}.docx`).send(buffer);
}));
