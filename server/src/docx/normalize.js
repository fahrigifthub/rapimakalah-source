import { getBodyStructure } from './reader.js';
import { getInner, setParagraphProperty } from './xml.js';

const HR_PATTERN = /<v:rect\b[^>]*o:hr="t"|<w:pict\b[^>]*>\s*<v:rect\b[^>]*o:hralign/;
const BAB_START = /^BAB\s+([IVXLCDM]+|\d+)\b/i;
const SECTION_TITLE = /^(kata\s+pengantar|daftar\s+(isi|pustaka|tabel|gambar|lampiran)|abstrak|lampiran)$/i;
const TOC_TITLE = /^daftar\s+isi$/i;

const isHr = (b) => b.type === 'w:p' && !b.data?.plainText && HR_PATTERN.test(b.xml) && !/<w:drawing\b|<a:blip\b/.test(b.xml);

/**
 * Documents pasted from chat/markdown tools carry "---" separators (horizontal
 * rule shapes) and a hand-typed table of contents. Convert them into what
 * Word expects: real section/page breaks and no duplicated TOC list.
 */
export function normalizePastedDocument(documentXml) {
  const structure = getBodyStructure(documentXml);
  const { blocks } = structure;
  const hrs = blocks.filter(isHr);
  const log = [];
  const hasRealSection = blocks.some((b) => b.type === 'w:p' && b.data?.sectionBreak);
  const hasTocField = /<w:instrText\b[^>]*>\s*TOC\s/.test(documentXml);
  if (!hrs.length && hasTocField) return { documentXml, log };
  const hasSectionTitles = blocks.some((b) => SECTION_TITLE.test(b.data?.plainText?.trim() || ''));
  if (!hrs.length && !hasSectionTitles) return { documentXml, log };

  const finalSect = blocks.find((b) => b.type === 'w:sectPr');
  const sectInner = finalSect ? (getInner(finalSect.xml, 'w:sectPr')?.inner ?? '') : '<w:pgSz w:w="11906" w:h="16838"/>';
  const cleanSect = sectInner.replace(/<w:(header|footer)Reference\b[^>]*\/>/g, '').replace(/<w:titlePg\b[^>]*\/>/g, '').replace(/<w:pgNumType\b[^>]*\/>/g, '');
  const sectParagraph = `<w:p><w:pPr><w:sectPr><w:type w:val="nextPage"/>${cleanSect.replace(/<w:type\b[^>]*\/>/g, '')}</w:sectPr></w:pPr></w:p>`;

  const edits = new Map(); // block.index -> replacement xml
  const removed = new Set();

  // 1) Manual table of contents: "DAFTAR ISI" followed by plain lines until a separator.
  if (!hasTocField) {
    const titleIdx = blocks.findIndex((b) => b.type === 'w:p' && TOC_TITLE.test(b.data?.plainText?.trim() || ''));
    if (titleIdx >= 0) {
      let end = -1;
      for (let i = titleIdx + 1; i < blocks.length; i += 1) {
        const b = blocks[i];
        if (b.type !== 'w:p') break;
        if (isHr(b) || b.data?.sectionBreak || b.data?.pageBreakCount > 0 || b.data?.pageBreakBefore) { end = i; break; }
        if (b.data?.hasImage) break;
      }
      if (end > titleIdx + 3) {
        for (let i = titleIdx + 1; i < end; i += 1) removed.add(i);
        log.push('Daftar isi manual diganti field daftar isi otomatis');
      }
    }
  }

  // 2) Separators.
  const firstBab = blocks.find((b) => b.type === 'w:p' && b.data && BAB_START.test(b.data.plainText) && !removed.has(b.index))?.index ?? null;
  const pendingBreakBefore = new Set();
  const nextTextIdx = (from) => {
    for (let i = from + 1; i < blocks.length; i += 1) {
      const b = blocks[i];
      if (removed.has(i) || isHr(b)) continue;
      if (b.type === 'w:p' && !b.data?.plainText && !b.data?.hasImage) continue;
      return i;
    }
    return null;
  };
  const firstHr = hrs[0];
  const frontHr = firstBab !== null ? [...hrs].reverse().find((h) => h.index < firstBab && nextTextIdx(h.index) === firstBab) : null;
  for (const hr of hrs) {
    const asSection = !hasRealSection && (hr === firstHr || hr === frontHr) && hr.index > 0 &&
      blocks.slice(0, hr.index).some((b) => b.data?.plainText);
    if (asSection) {
      edits.set(hr.index, sectParagraph);
      continue;
    }
    removed.add(hr.index);
    const next = nextTextIdx(hr.index);
    if (next !== null && blocks[next].type === 'w:p') pendingBreakBefore.add(next);
  }
  if (hrs.length) log.push('Garis pemisah (---) diubah menjadi pemisah halaman/section');

  const ops = [];
  for (const b of blocks) {
    if (b.type !== 'w:p') continue;
    if (removed.has(b.index)) ops.push({ start: b.start, end: b.end, xml: '' });
    else if (edits.has(b.index)) ops.push({ start: b.start, end: b.end, xml: edits.get(b.index) });
    else if (SECTION_TITLE.test(b.data?.plainText?.trim() || '') && !/<w:outlineLvl\b/.test(b.xml)) {
      let xml = b.xml;
      if (pendingBreakBefore.has(b.index)) xml = setParagraphProperty(xml, 'w:pageBreakBefore', '<w:pageBreakBefore/>');
      ops.push({ start: b.start, end: b.end, xml: setParagraphProperty(xml, 'w:outlineLvl', '<w:outlineLvl w:val="0"/>') });
    } else if (pendingBreakBefore.has(b.index)) ops.push({ start: b.start, end: b.end, xml: setParagraphProperty(b.xml, 'w:pageBreakBefore', '<w:pageBreakBefore/>') });
  }
  if (!ops.length) return { documentXml, log };

  let inner = structure.bodyInner;
  for (const op of ops.sort((a, b) => b.start - a.start)) inner = inner.slice(0, op.start) + op.xml + inner.slice(op.end);
  const out = documentXml.slice(0, structure.bodyRange.openEnd) + inner + documentXml.slice(structure.bodyRange.closeStart);
  return { documentXml: out, log };
}
