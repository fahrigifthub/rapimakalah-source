const MIME_BY_EXTENSION = {
  json: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  bin: 'application/octet-stream',
};

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/**
 * Pastikan setiap part di paket DOCX punya content type.
 *
 * Word menolak seluruh dokumen ("file appears to be corrupted") bila ada satu
 * part tanpa content type. Dokumen lama menyimpan `rapimakalah/source.json`
 * tanpa entri di `[Content_Types].xml`; fungsi ini menambal paket apa adanya
 * tanpa mengubah isi dokumen.
 */
export async function ensureContentTypes(zip) {
  const file = zip.file('[Content_Types].xml');
  if (!file) return { changed: false };
  let types = await file.async('string');
  const before = types;
  const declared = new Set(
    [...types.matchAll(/Default\s+Extension="([^"]+)"/gi)].map((m) => m[1].toLowerCase()),
  );
  const overrides = new Set(
    [...types.matchAll(/PartName="([^"]+)"/gi)].map((m) => m[1]),
  );

  const additions = [];
  for (const name of Object.keys(zip.files)) {
    if (zip.files[name].dir) continue;
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (name === '[Content_Types].xml' || name.endsWith('/')) continue;
    if (declared.has(ext) || overrides.has(`/${name}`)) continue;
    const mime = MIME_BY_EXTENSION[ext];
    if (mime && !declared.has(ext)) {
      declared.add(ext);
      additions.push(`<Default Extension="${escapeAttr(ext)}" ContentType="${mime}"/>`);
    } else {
      overrides.add(`/${name}`);
      additions.push(
        `<Override PartName="/${escapeAttr(name)}" ContentType="${mime || 'application/octet-stream'}"/>`,
      );
    }
  }

  if (!additions.length) return { changed: false };
  types = types.replace('</Types>', `${additions.join('')}</Types>`);
  if (types === before) return { changed: false };
  zip.file('[Content_Types].xml', types);
  return { changed: true };
}

/** Versi yang langsung mengembalikan buffer hasil generate. */
export async function generateDocx(zip) {
  await ensureContentTypes(zip);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
