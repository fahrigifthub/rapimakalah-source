import { findElement, setParagraphProperty } from './xml.js';

/**
 * Rapikan hanya tabel yang dibuat dari Markdown tempelan oleh textTables.js.
 * Tabel unggahan pengguna dan tabel anggota cover tidak disentuh di sini.
 */
const TEXT_TABLE = /<w:tblCaption\b[^>]*w:val="RapiMakalah Text Table"/;

function mergeSpacing(paragraph, { lineSpacing, applyLineSpacing, applyParagraphSpacing }) {
  const found = findElement(paragraph, 'w:spacing');
  const oldTag = found ? paragraph.slice(found.start, found.end) : '<w:spacing/>';
  const attrs = Object.fromEntries(
    [...oldTag.matchAll(/([\w:]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]),
  );
  if (applyLineSpacing && Number.isFinite(lineSpacing) && lineSpacing > 0) {
    attrs['w:line'] = String(Math.round(lineSpacing * 240));
    attrs['w:lineRule'] = 'auto';
  }
  if (applyParagraphSpacing) {
    // Makalah umumnya tidak menambahkan spasi paragraf ekstra di dalam sel.
    attrs['w:before'] = '0';
    attrs['w:after'] = '0';
  }
  if (!applyLineSpacing && !applyParagraphSpacing) return paragraph;
  const tag = `<w:spacing ${Object.entries(attrs).map(([key, value]) => `${key}="${value}"`).join(' ')}/>`;
  return setParagraphProperty(paragraph, 'w:spacing', tag);
}

export function formatTextTables(documentXml, { typography, options = {} }) {
  if (!typography) return documentXml;
  return documentXml.replace(/<w:tbl\b[\s\S]*?<\/w:tbl>/g, (table) => {
    if (!TEXT_TABLE.test(table)) return table;
    return table.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paragraph) =>
      mergeSpacing(paragraph, {
        lineSpacing: typography.lineSpacing,
        applyLineSpacing: Boolean(options.lineSpacing),
        applyParagraphSpacing: Boolean(options.paragraphSpacing),
      }),
    );
  });
}
