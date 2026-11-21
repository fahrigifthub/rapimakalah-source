import { getBodyStructure, readDocxBuffer } from '../docx/reader.js';
import { escapeXml } from '../docx/xml.js';

const NOISE = /^(?:\(?logo(?:\s+\w+)?\)?|\[logo(?:\s+\w+)?\]|logo\s+\w+|gambar\s+logo|foto(?:\s+\w+)?|gambar(?:\s+\w+)?|\d{1,2})$/i;
const GENERIC_LINE = /^(?:\[.*?\]|\(.*?\)|(?:disusun|dibuat|diajukan|makalah\s+ini)?\s*(?:oleh|untuk|guna)\s*:?.*|(?:dosen|pengampu|na+ma|nim|nis|kelas|jurusan|program\s+studi|fakultas|universitas|sekolah|mata\s+kuliah|tugas).*|[\p{L} .]+,\s*(?:\d{1,2}\s+)?(?:januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4})$/iu;
const SECTION_START = /^(kata\s+pengantar|daftar\s+isi|daftar\s+tabel|daftar\s+gambar|abstrak|abstract|prakata|bab\s+[ivxlcdm\d]+\b)/i;

/** Find the title page without depending on a heading/page-break being present. */
function initialPageBlocks(blocks) {
  const firstSection = blocks.findIndex((b) => b.type === 'w:p' && b.data && SECTION_START.test(String(b.data.plainText || '').trim()));
  if (firstSection > 0) return blocks.slice(0, firstSection);

  const firstBreak = blocks.findIndex((b) => b.type === 'w:p' && b.data && (b.data.pageBreakBefore || b.data.pageBreakCount || b.data.sectionBreak));
  if (firstBreak > 0) return blocks.slice(0, firstBreak);

  let end = -1;
  for (const block of blocks) {
    if (block.type !== 'w:p' || !block.data) continue;
    const text = String(block.data.plainText || '').trim();
    if (!text) {
      if (end >= 0) break;
      continue;
    }
    if (block.data.styleId && /^(Heading|Judul)\s*\d+$/i.test(block.data.styleId)) break;
    end = block.index;
  }
  return end > 0 ? blocks.slice(0, end + 1) : [];
}

function coverInfoFromBlocks(blocks) {
  const slice = initialPageBlocks(blocks);
  const hasMedia = slice.some((b) => /<w:drawing\b|<a:blip\b|<v:imagedata\b|<w:tbl\b/.test(b.xml));
  const lines = slice
    .filter((b) => b.type === 'w:p' && b.data)
    .map((b) => String(b.data.plainText || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  if (!lines.length && !hasMedia) return { present: false, generic: false, lines: [], hasMedia, blocks: slice };

  const placeholder = lines.some((line) => /\.{4,}|…{3,}/.test(line));
  const identity = lines.some((line) => {
    const stripped = line.replace(/\.{3,}/g, ' ').replace(/\b(19|20)\d{2}\b/g, ' ').trim();
    return /\d{4,}/.test(stripped) || /\b(?:nim|nis)\b\s*:?\s*\d{3,}/i.test(line);
  });
  const generic = !hasMedia && (placeholder || lines.some((line) => NOISE.test(line))) && !identity && lines.length <= 16;
  return { present: true, generic, lines, hasMedia, blocks: slice };
}

export async function inspectCover(buffer) {
  const zip = await readDocxBuffer(buffer);
  const structure = getBodyStructure(await zip.file('word/document.xml').async('string'));
  const { blocks: coverBlocks, ...info } = coverInfoFromBlocks(structure.blocks);
  return info;
}

/** Replace generic dotted title placeholders with a clean, centred title page. */
export async function rebuildGenericCover(buffer) {
  const zip = await readDocxBuffer(buffer);
  const xml = await zip.file('word/document.xml').async('string');
  const structure = getBodyStructure(xml);
  const info = coverInfoFromBlocks(structure.blocks);
  if (!info.present || !info.generic || !info.blocks.length || info.blocks.some((b) => b.type !== 'w:p')) {
    return { buffer, changed: false };
  }

  const texts = info.blocks.map((b) => String(b.data?.plainText || '').replace(/\s+/g, ' ').trim());
  const kept = texts.filter((line) =>
    line &&
    !/\.{4,}|…{3,}/.test(line) &&
    !/^(disusun|dibuat|diajukan)\s+(oleh|untuk)\s*:?$/i.test(line) &&
    !NOISE.test(line),
  );
  if (!kept.length) return { buffer, changed: false };

  const label = /^(?:makalah|laporan|proposal|tugas|paper)$/i.test(kept[0]) ? kept.shift() : 'MAKALAH';
  const paragraph = (text, { bold = false, size = 24 } = {}) =>
    `<w:p><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/><w:jc w:val="center"/></w:pPr>` +
    `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>${bold ? '<w:b/><w:bCs/>' : ''}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr>` +
    `<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
  const titleIndex = kept.reduce((best, line, i) => (line.length > kept[best].length ? i : best), 0);
  const body = [`<w:p><w:pPr><w:spacing w:after="240"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr><w:t xml:space="preserve">${escapeXml(label.toUpperCase())}</w:t></w:r></w:p>`];
  kept.forEach((line, i) => {
    if (i === titleIndex) body.push(paragraph(line, { bold: true, size: 32 }));
    else body.push(paragraph(line, { bold: GENERIC_LINE.test(line) && line.length <= 90, size: 24 }));
  });

  const start = info.blocks[0].start;
  const stop = info.blocks[info.blocks.length - 1].end;
  const inner = structure.bodyInner.slice(0, start) + body.join('') + structure.bodyInner.slice(stop);
  zip.file('word/document.xml', xml.slice(0, structure.bodyRange.openEnd) + inner + xml.slice(structure.bodyRange.closeStart));
  const out = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return { buffer: out, changed: true, lines: kept.length };
}
