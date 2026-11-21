import JSZip from 'jszip';
import {
  decodeXml,
  findElement,
  getAttr,
  getInner,
  getParagraphProperty,
  getRunProperty,
  scanChildren,
} from './xml.js';

export const PAGE_DIMENSIONS_TWIPS = {
  A4: { width: 11906, height: 16838 },
  F4: { width: 12242, height: 18708 },
  Letter: { width: 12240, height: 15840 },
  A5: { width: 8391, height: 11906 },
};

const HEADING_LEVEL_FROM_NAME = (name = '') => {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, ' ');
  let match = /^heading\s*([1-9])$/.exec(normalized);
  if (match) return Number(match[1]);
  match = /^judul\s*([1-9])$/.exec(normalized);
  if (match) return Number(match[1]);
  if (normalized === 'title') return 1;
  if (normalized === 'subtitle' || normalized === 'sub judul') return 2;
  if (['heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6'].includes(normalized)) {
    return Number(normalized.replace('heading', ''));
  }
  return null;
};

export function parseStyles(stylesXml = '') {
  const styles = new Map();
  if (!stylesXml) return styles;
  const inner = getInner(stylesXml, 'w:styles')?.inner;
  if (!inner) return styles;
  for (const child of scanChildren(inner)) {
    if (child.name !== 'w:style') continue;
    const styleId = getAttr(child.xml, 'w:styleId');
    if (!styleId) continue;
    const type = getAttr(child.xml, 'w:type') || 'paragraph';
    const name = getAttr(child.xml.match(/<w:name\b[^>]*>/)?.[0] || '', 'w:val');
    const basedOn = getAttr(child.xml.match(/<w:basedOn\b[^>]*>/)?.[0] || '', 'w:val');
    const outlineTag = child.xml.match(/<w:outlineLvl\b[^>]*>/)?.[0] || '';
    const outlineLevel = outlineTag ? Number(getAttr(outlineTag, 'w:val')) : null;
    let headingLevel = HEADING_LEVEL_FROM_NAME(name || styleId);
    if (!headingLevel && outlineLevel !== null && outlineLevel >= 0 && outlineLevel <= 5) {
      headingLevel = outlineLevel + 1;
    }
    if (/^(normal|default paragraph font|table normal|no spacing|header|footer)$/i.test(name || '')) {
      headingLevel = null;
    }
    const breakTag = child.xml.match(/<w:pageBreakBefore\b[^>]*>/)?.[0];
    const pageBreakBefore = breakTag ? !/^(0|false|off)$/i.test(getAttr(breakTag, 'w:val') || '') : null;
    styles.set(styleId, { styleId, type, name, basedOn, outlineLevel, headingLevel, pageBreakBefore });
  }
  return styles;
}

function textFromXml(xml) {
  let out = '';
  const re = /<[wm]:t(?:\s[^>]*)?>([\s\S]*?)<\/[wm]:t>|<w:tab\s*\/>|<w:br\b([^>]*)\/?>|<w:cr\s*\/>/g;
  let m;
  while ((m = re.exec(xml))) {
    if (m[0].startsWith('<w:tab')) out += '\t';
    else if (m[0].startsWith('<w:t') || m[0].startsWith('<m:t')) out += decodeXml(m[1]);
    else if (m[0].startsWith('<w:cr')) out += '\n';
    else if (/w:type\s*=\s*"page"/.test(m[2] || '')) out += '\f';
    else out += '\n';
  }
  return out;
}

function runsFromParagraph(paragraphXml) {
  const runs = [];
  const re = /<w:r(?![A-Za-z])(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g;
  let m;
  while ((m = re.exec(paragraphXml))) {
    const xml = m[0];
    const text = textFromXml(xml.replace(/<w:rPr>[\s\S]*?<\/w:rPr>/, ''));
    if (!text) continue;
    const rFonts = getRunProperty(xml, 'w:rFonts') || '';
    const sz = getRunProperty(xml, 'w:sz') || '';
    runs.push({
      text,
      font: getAttr(rFonts, 'w:ascii') || getAttr(rFonts, 'w:hAnsi') || null,
      size: sz ? Number(getAttr(sz, 'w:val')) / 2 : null,
      bold: Boolean(getRunProperty(xml, 'w:b')),
      italic: Boolean(getRunProperty(xml, 'w:i')),
      underline: Boolean(getRunProperty(xml, 'w:u')),
    });
  }
  return runs;
}

export function parseParagraph(paragraphXml, blockIndex = null) {
  const text = textFromXml(paragraphXml);
  const styleTag = getParagraphProperty(paragraphXml, 'w:pStyle') || '';
  const jcTag = getParagraphProperty(paragraphXml, 'w:jc') || '';
  const spacingTag = getParagraphProperty(paragraphXml, 'w:spacing') || '';
  const indTag = getParagraphProperty(paragraphXml, 'w:ind') || '';
  const numPr = getParagraphProperty(paragraphXml, 'w:numPr');
  const outlineTag = getParagraphProperty(paragraphXml, 'w:outlineLvl') || '';
  const pageBreakTag = getParagraphProperty(paragraphXml, 'w:pageBreakBefore');
  const pageBreakBefore = Boolean(pageBreakTag) && !/^(0|false|off)$/i.test(getAttr(pageBreakTag, 'w:val') || '');
  const breaks = (paragraphXml.match(/<w:br\b[^>]*w:type\s*=\s*"page"[^>]*\/?>/g) || []).length;
  // Section break living inside w:pPr: this paragraph ends a Word section.
  const sectPrTag = getParagraphProperty(paragraphXml, 'w:sectPr');
  const sectTypeTag = sectPrTag ? sectPrTag.match(/<w:type\b[^>]*>/)?.[0] || '' : '';
  const sectionBreak = sectPrTag ? getAttr(sectTypeTag, 'w:val') || 'nextPage' : null;
  // List numbering reference (w:numPr) with its level.
  const numIdTag = numPr ? numPr.match(/<w:numId\b[^>]*\/?>/)?.[0] || '' : '';
  const ilvlTag = numPr ? numPr.match(/<w:ilvl\b[^>]*\/?>/)?.[0] || '' : '';
  return {
    blockIndex,
    type: 'paragraph',
    text,
    plainText: text.replace(/[\f\n\t]/g, ' ').trim(),
    styleId: getAttr(styleTag, 'w:val') || null,
    alignment: getAttr(jcTag, 'w:val') || null,
    lineSpacing: spacingTag ? Number(getAttr(spacingTag, 'w:line') || 0) : null,
    lineRule: spacingTag ? getAttr(spacingTag, 'w:lineRule') : null,
    spaceBefore: spacingTag ? Number(getAttr(spacingTag, 'w:before') || 0) : null,
    spaceAfter: spacingTag ? Number(getAttr(spacingTag, 'w:after') || 0) : null,
    firstLineIndent: indTag ? Number(getAttr(indTag, 'w:firstLine') || getAttr(indTag, 'w:hanging') || 0) : null,
    leftIndent: indTag ? Number(getAttr(indTag, 'w:left') || 0) : null,
    hangingIndent: indTag ? Number(getAttr(indTag, 'w:hanging') || 0) : null,
    hasNumbering: Boolean(numPr),
    numId: numIdTag ? getAttr(numIdTag, 'w:val') : null,
    ilvl: ilvlTag ? Number(getAttr(ilvlTag, 'w:val') || 0) : 0,
    sectionBreak,
    outlineLevel: outlineTag ? Number(getAttr(outlineTag, 'w:val')) : null,
    pageBreakBefore,
    pageBreakCount: breaks,
    hasImage: /<w:drawing\b|<w:pict\b|<v:imagedata\b|<a:blip\b/.test(paragraphXml),
    hasTable: /<w:tbl\b/.test(paragraphXml),
    hasTocField: /<w:instrText\b[^>]*>\s*TOC\s/.test(paragraphXml),
    runs: runsFromParagraph(paragraphXml),
    xml: paragraphXml,
  };
}

export function getBodyStructure(documentXml) {
  const body = getInner(documentXml, 'w:body');
  if (!body) throw new Error('Dokumen tidak memiliki elemen <w:body>.');
  const blocks = scanChildren(body.inner).map((child, index) => {
    const name = child.name;
    let data = null;
    if (name === 'w:p') {
      data = parseParagraph(child.xml, index);
    } else if (name === 'w:tbl') {
      data = {
        blockIndex: index,
        type: 'table',
        text: textFromXml(child.xml),
        rows: countTableRows(child.xml),
      };
    } else if (name === 'w:sectPr') {
      data = { blockIndex: index, type: 'sectionProperties' };
    }
    return { ...child, index, type: name, data };
  });
  return { bodyInner: body.inner, bodyRange: body.range, blocks, documentXml };
}

function countTableRows(tableXml) {
  const re = /<w:tr\b/g;
  return (tableXml.match(re) || []).length;
}

function getSectionPropsFromXml(sectPrXml) {
  if (!sectPrXml) return null;
  const pgSz = sectPrXml.match(/<w:pgSz\b[^>]*>/)?.[0] || '';
  const pgMar = sectPrXml.match(/<w:pgMar\b[^>]*>/)?.[0] || '';
  const pgNum = sectPrXml.match(/<w:pgNumType\b[^>]*>/)?.[0] || '';
  return {
    width: pgSz ? Number(getAttr(pgSz, 'w:w')) : null,
    height: pgSz ? Number(getAttr(pgSz, 'w:h')) : null,
    orientation: pgSz ? getAttr(pgSz, 'w:orient') : null,
    margins: pgMar
      ? {
          top: Number(getAttr(pgMar, 'w:top') || 0),
          right: Number(getAttr(pgMar, 'w:right') || 0),
          bottom: Number(getAttr(pgMar, 'w:bottom') || 0),
          left: Number(getAttr(pgMar, 'w:left') || 0),
          header: Number(getAttr(pgMar, 'w:header') || 720),
          footer: Number(getAttr(pgMar, 'w:footer') || 720),
          gutter: Number(getAttr(pgMar, 'w:gutter') || 0),
        }
      : null,
    numFmt: pgNum ? getAttr(pgNum, 'w:fmt') : null,
    numStart: pgNum ? Number(getAttr(pgNum, 'w:start') || 0) : null,
    hasFooterReference: /<w:footerReference\b/.test(sectPrXml),
    raw: sectPrXml,
  };
}

export function getSectionProperties(blocks) {
  // Word stores the final section's sectPr at body level; earlier ones live in
  // the pPr of the paragraph that ends the section.
  const sections = [];
  for (const block of blocks) {
    if (block.type !== 'w:p') continue;
    const range = findElement(block.xml, 'w:sectPr');
    if (range) sections.push(getSectionPropsFromXml(block.xml.slice(range.start, range.end)));
  }
  const bodySect = blocks.find((b) => b.type === 'w:sectPr');
  if (bodySect) sections.push(getSectionPropsFromXml(bodySect.xml));
  return sections.filter(Boolean);
}

export function getBodySectPr(blocks) {
  const bodySect = blocks.find((b) => b.type === 'w:sectPr');
  return bodySect ? bodySect.xml : null;
}

const BAB_PATTERN = /^BAB\s+([IVXLCDM]+|\d+)\b/i;
const SUB_PATTERN = /^\d+\.\d+(\.\d+)?\.?\s+\S/;

export function detectHeadings(blocks, styles) {
  const headings = [];
  for (const block of blocks) {
    if (block.type !== 'w:p' || !block.data) continue;
    const p = block.data;
    const text = p.plainText;
    if (!text) continue;
    // Table-of-contents lines look like headings ("BAB I ...", "1.1 ...") but are not.
    if (p.styleId && /^(TOC\d?|TOCHeading|DaftarIsi\d?)$/i.test(p.styleId)) continue;
    const style = p.styleId ? styles.get(p.styleId) : null;
    let level = null;
    let source = null;

    if (style?.headingLevel) {
      level = style.headingLevel;
      source = 'style';
    } else if (p.outlineLevel !== null && p.outlineLevel >= 0 && p.outlineLevel < 6) {
      level = p.outlineLevel + 1;
      source = 'outline-level';
    } else if (BAB_PATTERN.test(text) && text.length < 100) {
      level = 1;
      source = 'pattern';
    } else if (SUB_PATTERN.test(text) && text.length < 120) {
      const depth = (text.match(/\./g) || []).length;
      level = Math.min(3, depth + 1);
      source = 'pattern';
    }

    if (!level) continue;
    if (level > 6) continue;
    // Skip tiny paragraphs and obvious captions.
    if (/^(gambar|tabel|figure|table)\s*[\d.]/i.test(text)) continue;
    headings.push({
      blockIndex: p.blockIndex,
      level,
      text,
      styleId: p.styleId,
      styleName: style?.name || null,
      source,
      pageBreakBefore: p.pageBreakBefore,
    });
  }
  return headings;
}

export function computeStats(blocks, headings) {
  let words = 0;
  let characters = 0;
  let paragraphs = 0;
  let tables = 0;
  let images = 0;
  let pageBreaks = 0;
  for (const block of blocks) {
    if (block.type === 'w:p' && block.data) {
      const text = block.data.plainText;
      if (text) {
        paragraphs += 1;
        words += text.split(/\s+/).filter(Boolean).length;
        characters += text.length;
      }
      images += (block.xml.match(/<a:blip\b|<v:imagedata\b/g) || []).length;
      pageBreaks += block.data.pageBreakCount + (block.data.pageBreakBefore ? 1 : 0);
    } else if (block.type === 'w:tbl') {
      tables += 1;
      const text = textFromXml(block.xml);
      words += text.split(/\s+/).filter(Boolean).length;
      characters += text.length;
      images += (block.xml.match(/<a:blip\b|<v:imagedata\b/g) || []).length;
    }
  }
  return { words, characters, paragraphs, tables, images, pageBreaks, headings: headings.length };
}

export function estimatePageCount(stats, templateConfig) {
  const page = templateConfig.page;
  const dims = PAGE_DIMENSIONS_TWIPS[page.size] || PAGE_DIMENSIONS_TWIPS.A4;
  const widthCm = ((page.orientation === 'landscape' ? dims.height : dims.width) / 1440) * 2.54;
  const heightCm = ((page.orientation === 'landscape' ? dims.width : dims.height) / 1440) * 2.54;
  const usableWidth = Math.max(4, widthCm - page.margins.left - page.margins.right);
  const usableHeight = Math.max(4, heightCm - page.margins.top - page.margins.bottom);
  const avgCharCm = templateConfig.typography.fontSize * 0.0176;
  const charsPerLine = Math.max(20, Math.floor(usableWidth / avgCharCm));
  const lineHeightCm = templateConfig.typography.fontSize * 0.0353 * templateConfig.typography.lineSpacing;
  const linesPerPage = Math.max(10, Math.floor(usableHeight / lineHeightCm));
  const charsPerPage = charsPerLine * linesPerPage;
  const pages = Math.ceil(stats.characters / charsPerPage) + stats.pageBreaks;
  return { pageCount: Math.max(1, pages), charsPerPage, linesPerPage, estimated: true };
}

/** Read image relationships and return data URLs keyed by relationship id. */
export async function extractPreviewImages(zip, documentRelsXml) {
  const images = {};
  if (!documentRelsXml) return images;
  const rels = new Map();
  for (const m of documentRelsXml.matchAll(/<Relationship\b[^>]*>/g)) {
    const tag = m[0];
    const id = getAttr(tag, 'Id');
    const target = getAttr(tag, 'Target');
    if (id && target) rels.set(id, target.replace(/^\.\//, ''));
  }
  let totalBytes = 0;
  for (const [id, target] of rels) {
    if (!/\.(png|jpe?g|gif|bmp|webp)$/i.test(target)) continue;
    if (totalBytes > 12 * 1024 * 1024) break;
    const normalized = target.startsWith('/') ? target.slice(1) : `word/${target}`;
    const file = zip.file(normalized) || zip.file(target);
    if (!file) continue;
    const buffer = await file.async('nodebuffer');
    totalBytes += buffer.length;
    const ext = target.split('.').pop().toLowerCase();
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    images[id] = `data:image/${mime};base64,${buffer.toString('base64')}`;
  }
  return images;
}

export function getDocumentRelsPath() {
  return 'word/_rels/document.xml.rels';
}

export async function readDocxBuffer(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const required = ['[Content_Types].xml', 'word/document.xml'];
  for (const name of required) {
    if (!zip.file(name)) throw new Error('File bukan dokumen DOCX yang valid.');
  }
  return zip;
}

export { textFromXml, findElement };
