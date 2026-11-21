import { getAttr, scanChildren } from '../docx/xml.js';

/**
 * Validate the real file signature and the ZIP structure — never trust the
 * extension or the browser-supplied MIME type alone.
 */
export async function validateDocxBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
    return { ok: false, reason: 'File kosong atau tidak dapat dibaca.' };
  }
  const signature = buffer.subarray(0, 4).toString('hex');
  if (!['504b0304', '504b0506', '504b0708'].includes(signature)) {
    return { ok: false, reason: 'File bukan arsip DOCX/OOXML yang valid (signature tidak cocok).' };
  }
  const JSZip = (await import('jszip')).default;
  let zip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    return { ok: false, reason: 'File tidak dapat dibuka sebagai arsip DOCX.' };
  }
  const contentType = zip.file('[Content_Types].xml');
  const documentFile = zip.file('word/document.xml');
  if (!contentType || !documentFile) {
    return { ok: false, reason: 'Struktur DOCX tidak lengkap: [Content_Types].xml atau word/document.xml tidak ditemukan.' };
  }
  const documentXml = await documentFile.async('string');
  if (!/<w:document\b/.test(documentXml) || !/<w:body\b/.test(documentXml)) {
    return { ok: false, reason: 'Dokumen bukan WordprocessingML yang valid.' };
  }
  // Basic zip-bomb guard (uncompressed size aggregate).
  let uncompressed = 0;
  for (const entry of Object.values(zip.files)) {
    uncompressed += entry?._data?.uncompressedSize || 0;
  }
  if (uncompressed > 200 * 1024 * 1024) {
    return { ok: false, reason: 'Dokumen terlalu besar setelah dekompresi (maksimum 200 MB).' };
  }
  const entries = Object.keys(zip.files);
  if (entries.some((name) => name.includes('..'))) {
    return { ok: false, reason: 'Arsip DOCX mengandung path yang tidak aman.' };
  }
  return { ok: true, zip };
}

export { getAttr, scanChildren };
