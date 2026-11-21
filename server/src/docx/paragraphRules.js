import { classifyPrefaceBlocks } from './frontmatter.js';

export function isLetteredLabel(paragraph) {
  const text = paragraph.plainText;
  return /^[A-Z]\.\s+\S/.test(text) && text.length < 90 && !/[.:;]\s*$/.test(text) && !paragraph.hasNumbering;
}

export function bodyAlignment(xml, alignment) {
  const expected = alignment === 'justify' ? 'both' : alignment || 'both';
  const softBreak = /<w:br\b(?![^>]*w:type="(?:page|column)")[^>]*\/>/.test(xml);
  return softBreak && expected === 'both' ? 'left' : expected;
}

export function prefaceRolesFor(blocks, headingIndexes, coverEnd = null) {
  const start = blocks.find(b => b.type === 'w:p' && /^kata\s+pengantar$/i.test(b.data?.plainText || '') && (coverEnd === null || b.index > coverEnd))?.index;
  if (start === undefined) return new Map();
  const end = blocks.find(b => b.index > start && b.type === 'w:p' && (/^(daftar\s+(isi|tabel|gambar)|abstrak)$/i.test(b.data?.plainText || '') || headingIndexes.has(b.index)))?.index ?? blocks.length;
  return classifyPrefaceBlocks(blocks, start, end);
}
