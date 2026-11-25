import {
  PPR_ORDER,
  RPR_ORDER,
  findElement,
  getAttr,
  getInner,
  removeChild,
  setParagraphProperty,
  setRunProperty,
  textParagraph,
  upsertChild,
  escapeXml,
} from './xml.js';
import {
  PAGE_DIMENSIONS_TWIPS,
  computeStats,
  detectHeadings,
  estimatePageCount,
  getBodyStructure,
  getBodySectPr,
  getSectionProperties,
  parseStyles,
  parseParagraph,
  readDocxBuffer,
} from './reader.js';
import { applyPageNumbering, cmToTwips, setNoExpandShiftReturn, setUpdateFields, updateSectPr } from './numbering.js';
import { fillTableOfContents } from './toc.js';
import { normalizePastedDocument } from './normalize.js';
import { isLetteredLabel, bodyAlignment } from './paragraphRules.js';
import { buildCoverXml, para, buildPrefaceXml, logoPara, classifyPrefaceBlocks, SIGNATURE_FRAME, indonesianDate } from './frontmatter.js';
import { normalizeCoverTables, refreshCoverMembers } from './coverTables.js';
import { buildCoverMembersTable } from './coverMembers.js';
import { ensureContentTypes } from './contentTypes.js';
import { formatTextTables } from './formatTextTables.js';
import { convertPipeParagraphTables } from './convertPipeParagraphTables.js';
import { applyListContinuationIndent, applyNumberedListIndent, numberedListTextIndent } from './listIndent.js';
import { convertTypedNumberedLists } from './typedNumbering.js';

const PREFACE_TITLE = /^kata\s+pengantar$/i;
const BIB_TITLE = /^(daftar\s+pustaka|referensi|references|bibliography)$/i;

function insertAtBodyStart(documentXml, xml) {
  const body = getInner(documentXml, 'w:body');
  if (!body) return documentXml;
  return documentXml.slice(0, body.range.openEnd) + xml + documentXml.slice(body.range.openEnd);
}

function insertBeforeBlock(documentXml, blockIndex, xml) {
  const structure = getBodyStructure(documentXml);
  const body = getInner(documentXml, 'w:body');
  const block = structure.blocks[blockIndex];
  if (!body || !block) return documentXml;
  return documentXml.slice(0, body.range.openEnd + block.start) + xml + documentXml.slice(body.range.openEnd + block.start);
}

// Cover content is centred as a whole: no inherited/negative indents, and
// logos, member lists and institution lines all share the same axis.
function normalizeCoverParagraph(xml) {
  let out = setParagraphProperty(xml, 'w:numPr', '');
  out = setParagraphProperty(out, 'w:ind', '<w:ind w:left="0" w:right="0" w:firstLine="0" w:hanging="0"/>');
  out = setParagraphProperty(out, 'w:jc', '<w:jc w:val="center"/>');
  // Keep bottom-anchored institution paragraphs pinned to the page margin;
  // other inherited frames are removed when normalizing cover content.
  if (!/<w:framePr\b[^>]*w:yAlign="bottom"/.test(out)) {
    out = setParagraphProperty(out, 'w:framePr', '');
  }
  // Inline images follow paragraph alignment. For anchored pictures the anchor
  // position controls alignment, so make that position relative to the page.
  return out.replace(/<wp:positionH\b([^>]*)>([\s\S]*?)<\/wp:positionH>/g, (_match, attrs, inner) => {
    const centered = inner.includes('<wp:align>')
      ? inner.replace(/<wp:align>[^<]*<\/wp:align>/, '<wp:align>center</wp:align>')
      : inner.replace(/<wp:posOffset>[^<]*<\/wp:posOffset>/, '<wp:align>center</wp:align>');
    return `<wp:positionH${attrs}>${centered}</wp:positionH>`;
  });
}

function normalizeCoverTable(xml) {
  const isMemberTable = /<w:tblCaption\b[^>]*w:val="RapiMakalah Cover Members"/.test(xml);
  return xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paragraph) => {
    const normalized = normalizeCoverParagraph(paragraph);
    if (!isMemberTable) return normalized;

    // Hilangkan bold dari run anggota agar nama dan NIM tetap regular meski
    // paragraf atau style sumbernya mewarisi format tebal.
    return normalized.replace(/<w:b(?:Cs)?\b[^>]*\/?\s*>/g, '<w:b w:val="0"/>');
  });
}

const INSTITUTION_ANCHOR = /PROGRAM\s+STUDI|FAKULTAS|UNIVERSITAS/i;
const INSTITUTION_PART = /PROGRAM\s+STUDI|FAKULTAS|UNIVERSITAS|DEPARTEMEN/i;
const YEAR_LINE = /^(?:19|20)\d{2}$/;

/**
 * Kumpulkan paragraf blok institusi di area cover. Blok ini bisa berupa satu
 * paragraf gabungan (cover baru) atau beberapa paragraf berurutan (cover lama).
 */
function coverInstitutionBlocks(blocks, coverEnd) {
  const limit = coverEnd ?? blocks.length - 1;
  const inCover = blocks.filter((block) => block.index <= limit && block.type === 'w:p' && block.data);
  const start = inCover.findIndex((block) => INSTITUTION_ANCHOR.test(block.data.plainText));
  if (start < 0) return [];

  const group = [];
  for (let i = start; i < inCover.length; i += 1) {
    const text = inCover[i].data.plainText.trim();
    if (!text) continue;
    if (!INSTITUTION_PART.test(text) && !YEAR_LINE.test(text)) break;
    group.push(inCover[i]);
  }
  return group;
}

/** Satu paragraf berisi semua baris institusi; baris dipisah <w:br/>. */
function buildPinnedInstitutionParagraph(config, text) {
  const size = Number(config.cover?.institutionSize) || Number(config.cover?.titleSize) || 16;
  return para(config, text, {
    align: 'center',
    bold: true,
    size,
    line: 276,
    frame: coverInstitutionFrame(config),
    keepLines: true,
  });
}

/** Pertahankan line break yang sudah ada, cukup tambahkan frame bawah. */
function pinInstitutionParagraph(xml, config) {
  const normalized = normalizeCoverParagraph(xml);
  const framed = setParagraphProperty(normalized, 'w:framePr', coverInstitutionFrame(config));
  return setParagraphProperty(framed, 'w:keepLines', '<w:keepLines/>');
}

function coverInstitutionFrame(config) {
  const page = PAGE_DIMENSIONS_TWIPS[config.page.size] || PAGE_DIMENSIONS_TWIPS.A4;
  const pageWidth = config.page.orientation === 'landscape' ? page.height : page.width;
  const textWidth = pageWidth - Math.round(((config.page.margins.left + config.page.margins.right) / 2.54) * 1440);
  return `<w:framePr w:w="${textWidth}" w:hSpace="0" w:wrap="notBeside" w:vAnchor="margin" w:hAnchor="margin" w:xAlign="center" w:yAlign="bottom"/>`;
}

// TOC lives in a w:sdt wrapper that the paragraph loop never visits. Normalise
// indents per TOC level and keep the right tab (page numbers) inside the margin.
function normalizeTocSdt(sdtXml, config, tabPos, options) {
  return sdtXml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (p) => {
    const style = /<w:pStyle w:val="(TOC\d|TOCHeading)"/.exec(p)?.[1];
    if (!style) return p.replace(/<w:ind\b[^>]*\/>/, '<w:ind w:left="0" w:right="0"/>');
    const hasText = /<w:t[\s>]/.test(p);
    if (style === 'TOCHeading') {
      if (!hasText) return '';
      let h = applyTypographyToRuns(p, { fontFamily: config.typography.fontFamily, fontSize: config.headings.chapter.fontSize });
      h = applyBold(h, true);
      h = setParagraphProperty(h, 'w:ind', '<w:ind w:left="0" w:right="0"/>');
      return setParagraphProperty(h, 'w:jc', '<w:jc w:val="center"/>');
    }
    const level = Number(style.slice(3)) || 1;
    let out = p;
    if (options.font || options.fontSize) {
      out = applyTypographyToRuns(out, {
        fontFamily: options.font ? config.typography.fontFamily : null,
        fontSize: options.fontSize ? config.typography.fontSize : null,
      });
    }
    out = setParagraphProperty(out, 'w:ind', `<w:ind w:left="${(level - 1) * 440}" w:right="0"/>`);
    out = setParagraphProperty(out, 'w:jc', '<w:jc w:val="left"/>');
    out = mergeParagraphSpacing(out, { lineSpacing: 1.5, before: 0, after: 4, applyLine: true, applySpacing: true });
    return out.replace(/<w:tab w:val="right"([^>]*?)w:pos="\d+"/g, `<w:tab w:val="right"$1w:pos="${tabPos}"`);
  });
}

function applyPrefaceRole(xml, role, config) {
  const typography = config.typography;
  const size = typography.fontSize;
  if (role === 'title') {
    let out = applyTypographyToRuns(xml, { fontFamily: typography.fontFamily, fontSize: config.headings.chapter.fontSize });
    out = applyBold(out, true);
    out = setCaps(out, true);
    out = setParagraphProperty(out, 'w:jc', '<w:jc w:val="center"/>');
    out = setIndent(out, 0);
    out = mergeParagraphSpacing(out, { lineSpacing: 1.5, before: 0, after: 12, applyLine: true, applySpacing: true });
    return setParagraphProperty(out, 'w:outlineLvl', '<w:outlineLvl w:val="0"/>');
  }
  let out = applyTypographyToRuns(xml, { fontFamily: typography.fontFamily, fontSize: size });
  out = setParagraphProperty(out, 'w:jc', '<w:jc w:val="right"/>');
  out = setParagraphProperty(out, 'w:ind', '<w:ind w:left="0" w:right="0" w:firstLine="0" w:hanging="0"/>');
  if (role === 'placeDate') {
    const today = indonesianDate().split(' ')[0];
    let filled = false;
    out = out.replace(/<w:t(?:\s[^>]*)?>([^<]*?,\s*)([A-Za-z]+\s+\d{4})\s*<\/w:t>/, (m, head, rest) => {
      if (filled) return m;
      filled = true;
      return `<w:t xml:space="preserve">${head}${today} ${rest}</w:t>`;
    });
  }
  out = setParagraphProperty(out, 'w:framePr', SIGNATURE_FRAME);
  out = setParagraphProperty(out, 'w:keepNext', '<w:keepNext/>');
  out = mergeParagraphSpacing(out, { lineSpacing: 1.5, before: role === 'placeDate' ? 36 : 0, after: role === 'placeDate' ? 48 : role === 'signatureLabel' ? 60 : 0, applyLine: true, applySpacing: true });
  if (role === 'signatureName') out = applyBold(out, true);
  return out;
}

const WORD_ALIGN = { left: 'left', center: 'center', right: 'right', justify: 'both' };

function mergeTagAttrs(tagXml, updates) {
  const name = /^<([\w:]+)/.exec(tagXml)?.[1] || 'w:spacing';
  const attrs = new Map();
  for (const m of tagXml.matchAll(/([\w:]+)="([^"]*)"/g)) attrs.set(m[1], m[2]);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined) attrs.delete(key);
    else attrs.set(key, String(value));
  }
  const serialized = [...attrs].map(([k, v]) => ` ${k}="${v}"`).join('');
  return `<${name}${serialized}/>`;
}

function withRunTypography(inner, fontFamily, fontSize) {
  let result = inner;
  if (fontFamily) {
    const family = escapeXml(fontFamily);
    result = upsertChild(
      result,
      'w:rFonts',
      `<w:rFonts w:ascii="${family}" w:hAnsi="${family}" w:eastAsia="${family}" w:cs="${family}"/>`,
      RPR_ORDER,
    );
  }
  if (fontSize) {
    const half = Math.round(fontSize * 2);
    result = upsertChild(result, 'w:sz', `<w:sz w:val="${half}"/>`, RPR_ORDER);
    result = upsertChild(result, 'w:szCs', `<w:szCs w:val="${half}"/>`, RPR_ORDER);
  }
  return result;
}

function applyTypographyToRuns(paragraphXml, { fontFamily, fontSize }) {
  return paragraphXml.replace(/<w:r(?![A-Za-z])(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g, (run) => {
    if (run.endsWith('/>')) return run;
    let out = run;
    if (fontFamily) {
      const family = escapeXml(fontFamily);
      out = setRunProperty(
        out,
        'w:rFonts',
        `<w:rFonts w:ascii="${family}" w:hAnsi="${family}" w:eastAsia="${family}" w:cs="${family}"/>`,
      );
    }
    if (fontSize) {
      out = setRunProperty(out, 'w:sz', `<w:sz w:val="${Math.round(fontSize * 2)}"/>`);
      out = setRunProperty(out, 'w:szCs', `<w:szCs w:val="${Math.round(fontSize * 2)}"/>`);
    }
    return out;
  });
}

function applyBold(paragraphXml, bold) {
  return paragraphXml.replace(/<w:r(?![A-Za-z])(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g, (run) => {
    if (run.endsWith('/>')) return run;
    let out = run;
    if (bold) {
      out = setRunProperty(out, 'w:b', '<w:b/>');
      out = setRunProperty(out, 'w:bCs', '<w:bCs/>');
    } else {
      const rpr = getInner(out, 'w:rPr');
      if (rpr) {
        const inner = removeChild(removeChild(rpr.inner, 'w:b'), 'w:bCs');
        out = out.slice(0, rpr.range.openEnd) + inner + out.slice(rpr.range.closeStart);
      }
    }
    return out;
  });
}

function setCaps(paragraphXml, enabled) {
  if (!enabled) return paragraphXml;
  return paragraphXml.replace(/<w:r(?![A-Za-z])(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g, (run) => {
    if (run.endsWith('/>')) return run;
    return setRunProperty(run, 'w:caps', '<w:caps/>');
  });
}

function mergeParagraphSpacing(paragraphXml, { lineSpacing, before, after, applyLine, applySpacing }) {
  const existing = findElement(paragraphXml, 'w:spacing');
  const updates = {};
  if (applyLine && lineSpacing) {
    updates['w:line'] = Math.round(lineSpacing * 240);
    updates['w:lineRule'] = 'auto';
  }
  if (applySpacing && before !== undefined) updates['w:before'] = cmToTwipsRelative(before);
  if (applySpacing && after !== undefined) updates['w:after'] = cmToTwipsRelative(after);
  if (!Object.keys(updates).length) return paragraphXml;
  const tag = existing ? paragraphXml.slice(existing.start, existing.end) : '<w:spacing/>';
  return setParagraphProperty(paragraphXml, 'w:spacing', mergeTagAttrs(tag, updates));
}

// Points → twips was intended; spacing is configured in points.
function cmToTwipsRelative(points) {
  return Math.round(Number(points) * 20);
}

// Left/right are written as explicit 0 (not removed) so indents inherited from
// the paragraph style, or dragged into the margin on Word's ruler, are overridden.
function setIndent(paragraphXml, firstLineCm, leftTwips = 0) {
  const existing = findElement(paragraphXml, 'w:ind');
  const updates = {
    'w:left': leftTwips,
    'w:right': 0,
    'w:start': null,
    'w:end': null,
    'w:leftChars': null,
    'w:rightChars': null,
    'w:firstLineChars': null,
    'w:hangingChars': null,
    'w:hanging': null,
    'w:firstLine': firstLineCm > 0 ? cmToTwips(firstLineCm) : null,
  };
  const tag = existing ? paragraphXml.slice(existing.start, existing.end) : '<w:ind/>';
  return setParagraphProperty(paragraphXml, 'w:ind', mergeTagAttrs(tag, updates));
}

// Numbered headings need a tab (not a single space) after the number so the
// title starts at the hanging-indent position ("1.1     Latar Belakang").
function setNumberSuffixTab(numberingXml, pairs) {
  let out = numberingXml;
  for (const pair of pairs) {
    const [numId, ilvl] = pair.split(':');
    const abs = new RegExp(`<w:num\\b[^>]*w:numId="${numId}"[^>]*>[\\s\\S]*?<w:abstractNumId w:val="(\\d+)"`).exec(out)?.[1];
    if (abs === undefined) continue;
    out = out.replace(new RegExp(`<w:abstractNum\\b[^>]*w:abstractNumId="${abs}"[\\s\\S]*?</w:abstractNum>`), (block) =>
      block.replace(new RegExp(`<w:lvl\\b[^>]*w:ilvl="${ilvl}"[\\s\\S]*?</w:lvl>`), (lvl) => {
        if (/<w:suff\b/.test(lvl)) return lvl.replace(/<w:suff\b[^>]*\/>/, '<w:suff w:val="tab"/>');
        return lvl.replace(/<w:lvlText\b/, '<w:suff w:val="tab"/><w:lvlText');
      }),
    );
  }
  return out;
}

// Sub-chapter headings ("1.1 Latar Belakang"): wrapped lines must align under
// the first letter of the title, not under the number (hanging indent + tab).
function hangNumberedHeading(paragraphXml, role) {
  if (role < 2) return paragraphXml;
  const ilvl = Number(/<w:numPr>[\s\S]*?<w:ilvl w:val="(\d+)"/.exec(paragraphXml)?.[1] ?? NaN);
  const typed = /<w:t(?:\s[^>]*)?>(\d+(?:\.\d+)+)\.?\s+[^<]/.exec(paragraphXml);
  if (Number.isNaN(ilvl) && !typed) return paragraphXml;
  const width = (Number.isNaN(ilvl) ? typed[1].split('.').length - 1 : ilvl) >= 2 ? 851 : 709;
  let out = paragraphXml;
  if (Number.isNaN(ilvl)) {
    let done = false;
    out = out.replace(/(<w:t(?:\s[^>]*)?>)(\d+(?:\.\d+)+\.?)\s+([^<]*)(<\/w:t>)/, (m, open, num, rest, close) => {
      if (done) return m;
      done = true;
      return `${open}${num}${close}<w:tab/><w:t xml:space="preserve">${rest}${close}`;
    });
  }
  return setParagraphProperty(out, 'w:ind', `<w:ind w:left="${width}" w:right="0" w:hanging="${width}"/>`);
}

// Lists keep their own hanging layout, but negative / out-of-margin indents are clamped.
function clampListIndent(paragraphXml) {
  const existing = findElement(paragraphXml, 'w:ind');
  if (!existing) return paragraphXml;
  const tag = paragraphXml.slice(existing.start, existing.end);
  const left = Number(/w:(?:left|start)="(-?\d+)"/.exec(tag)?.[1] ?? 0);
  const right = Number(/w:(?:right|end)="(-?\d+)"/.exec(tag)?.[1] ?? 0);
  if (left >= 0 && right >= 0) return paragraphXml;
  const updates = {};
  if (left < 0) {
    updates['w:left'] = 720;
    updates['w:start'] = null;
    updates['w:hanging'] = 360;
  }
  if (right < 0) {
    updates['w:right'] = 0;
    updates['w:end'] = null;
  }
  return setParagraphProperty(paragraphXml, 'w:ind', mergeTagAttrs(tag, updates));
}

function applyDocumentDefaults(stylesXml, config) {
  if (!stylesXml) return stylesXml;
  const family = escapeXml(config.typography.fontFamily);
  const half = Math.round(config.typography.fontSize * 2);
  const fontXml = `<w:rFonts w:ascii="${family}" w:hAnsi="${family}" w:eastAsia="${family}" w:cs="${family}"/>`;
  const sizeXml = `<w:sz w:val="${half}"/><w:szCs w:val="${half}"/>`;

  let xml = stylesXml;
  xml = xml.replace(/(<w:docDefaults\b[^>]*>)([\s\S]*?)(<\/w:docDefaults>)/, (all, open, inner, close) => {
    let next = inner;
    if (/<w:rPrDefault\b/.test(next)) {
      next = next.replace(/(<w:rPrDefault\b[^>]*>)([\s\S]*?)(<\/w:rPrDefault>)/, (m2, o2, i2, c2) => {
        if (/<w:rPr\b/.test(i2)) {
          return o2 + i2.replace(/(<w:rPr\b[^>]*>)([\s\S]*?)(<\/w:rPr>)/, (m3, o3, i3, c3) => o3 + withRunTypography(i3, config.typography.fontFamily, config.typography.fontSize) + c3) + c2;
        }
        return `${o2}<w:rPr>${fontXml}${sizeXml}</w:rPr>${c2}`;
      });
    } else {
      next = `<w:rPrDefault><w:rPr>${fontXml}${sizeXml}</w:rPr></w:rPrDefault>${next}`;
    }
    return open + next + close;
  });

  // Normal style is inherited by most new paragraphs in Word.
  xml = xml.replace(/(<w:style\b[^>]*w:styleId="Normal"[^>]*>)([\s\S]*?)(<\/w:style>)/, (all, open, inner, close) => {
    const rPr = getInner(inner, 'w:rPr');
    let next = inner;
    if (rPr) {
      next = inner.slice(0, rPr.range.openEnd) + withRunTypography(rPr.inner, config.typography.fontFamily, config.typography.fontSize) + inner.slice(rPr.range.closeStart);
    } else {
      next = inner + `<w:rPr>${fontXml}${sizeXml}</w:rPr>`;
    }
    return open + next + close;
  });
  return xml;
}

function computeBoundaries(blocks, headings) {
  const firstBodyHeading = headings.find((h) => h.level === 1 && /^BAB\b/i.test(h.text));
  const fallback = headings.find((h) => h.level === 1);
  const bodyStart = firstBodyHeading?.blockIndex ?? fallback?.blockIndex ?? null;
  const prefaceStart = blocks.find((block) => block.type === 'w:p' && block.data && PREFACE_TITLE.test(block.data.plainText))?.index ?? null;
  const tocStart = blocks.find((block) => block.type === 'w:p' && block.data && /^daftar\s+isi$/i.test(block.data.plainText))?.index ?? null;
  const coverFrontMatterStart = [prefaceStart, tocStart].filter(Number.isInteger).sort((a, b) => a - b)[0] ?? null;
  const coverLimit = [prefaceStart, tocStart, bodyStart].filter(Number.isInteger).sort((a, b) => a - b)[0] ?? null;
  let coverEnd = null;
  if (coverLimit !== null) {
    for (const block of blocks) {
      if (block.index >= coverLimit) break;
      if (block.type !== 'w:p' || !block.data) continue;
      // The cover ends at its first real page/section boundary. Do not include
      // front matter (for example Kata Pengantar) just because it precedes BAB I.
      if (block.data.sectionBreak || block.data.pageBreakCount > 0 || block.data.pageBreakBefore) {
        coverEnd = block.data.pageBreakBefore ? (block.index > 0 ? block.index - 1 : null) : block.index;
        break;
      }
    }
    // Never absorb front matter into the cover, even when the source has no
    // explicit page break before its first section.
    if (coverFrontMatterStart !== null && (coverEnd === null || coverEnd >= coverFrontMatterStart)) coverEnd = coverFrontMatterStart > 0 ? coverFrontMatterStart - 1 : null;
    // Word templates often separate the cover from BAB I only through layout
    // settings that are not represented by a paragraph break. Preserve any
    // real content before the first front-matter/body heading as the cover.
    if (coverEnd === null && coverLimit > 0 && looksLikeExistingCover(blocks, coverLimit)) coverEnd = coverLimit - 1;
  } else {
    for (const block of blocks) {
      if (block.type !== 'w:p' || !block.data) continue;
      if (block.data.sectionBreak || block.data.pageBreakCount > 0 || block.data.pageBreakBefore) {
        coverEnd = block.index;
        break;
      }
    }
  }
  return { bodyStart, coverEnd, source: 'auto' };
}

function looksLikeExistingCover(blocks, endIndex) {
  const before = blocks.slice(0, endIndex);
  const content = before.filter((block) => block.type === 'w:p' || block.type === 'w:tbl');
  const textBlocks = content.filter((block) => block.data?.plainText?.trim());
  const text = textBlocks.map((block) => block.data.plainText.trim()).join(' ');
  const hasMedia = content.some((block) => /<w:drawing\b|<a:blip\b|<v:imagedata\b/.test(block.xml));
  const hasTable = content.some((block) => block.type === 'w:tbl');
  // A title-only paragraph is still a meaningful user cover when it is
  // accompanied by a logo/table. Text-only templates need a little more
  // evidence so a stray document title is not treated as a whole cover.
  return hasMedia || hasTable || textBlocks.length >= 2 || text.length >= 30;
}

function isBareBab(text) {
  return /^BAB\s+([IVXLCDM]+|\d+)\s*$/i.test(text.trim());
}

function headingRoleMap(blocks, headings) {
  const roles = new Map();
  for (const h of headings) roles.set(h.blockIndex, h.level);
  // Common Indonesian layout: "BAB I" and the chapter title are separate
  // paragraphs. Treat the following short title as part of the chapter heading.
  for (const h of headings) {
    if (h.level !== 1 || !isBareBab(h.text)) continue;
    let seenText = false;
    for (let i = h.blockIndex + 1; i < blocks.length; i += 1) {
      const block = blocks[i];
      if (block.type !== 'w:p' || !block.data) break;
      const text = block.data.plainText;
      if (!text) continue;
      if (roles.has(i)) break;
      if (!seenText && text.length <= 90) {
        roles.set(i, 1);
        h.continuationBlockIndex = i;
        seenText = true;
        continue;
      }
      break;
    }
  }
  return roles;
}

/** Replace the picture paragraph(s) on an existing cover with the uploaded logo. */
function replaceCoverPicture(documentXml, coverBlocks, pre, meta) {
  const pics = coverBlocks.filter((b) => b.type === 'w:p' && /<w:drawing\b/.test(b.xml));
  if (!pics.length) return null;
  const first = pics[0];
  const base = pre.bodyRange.openEnd;
  let out = documentXml;
  for (const block of [...pics].reverse()) {
    const replacement = block === first ? logoPara(meta) : '';
    out = out.slice(0, base + block.start) + replacement + out.slice(base + block.end);
  }
  return out;
}

const URL_RE = /(https?:\/\/[^\s<>"]+?)(?=[.,;:)\]]*(?:\s|$))/g;

// Turn bare URLs inside simple text runs into clickable, blue/underlined hyperlinks.
function linkifyUrls(paragraphXml, addLink) {
  return paragraphXml.replace(/<w:r(?![A-Za-z])(?:\s[^>]*)?>((?:<w:rPr>[\s\S]*?<\/w:rPr>)?)<w:t(?:\s[^>]*)?>([^<]*)<\/w:t><\/w:r>/g, (whole, rPr, text) => {
    const decoded = text.replace(/&amp;/g, '&');
    URL_RE.lastIndex = 0;
    if (!URL_RE.test(decoded)) return whole;
    const enc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const plain = (s) => (s ? `<w:r>${rPr}<w:t xml:space="preserve">${enc(s)}</w:t></w:r>` : '');
    const linkRPr = rPr
      ? rPr.replace(/<w:(?:color|u)\b[^>]*\/>/g, '').replace('</w:rPr>', '<w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr>')
      : '<w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr>';
    let out = '';
    let last = 0;
    URL_RE.lastIndex = 0;
    let m;
    while ((m = URL_RE.exec(decoded))) {
      out += plain(decoded.slice(last, m.index));
      const rid = addLink(m[1]);
      out += `<w:hyperlink r:id="${rid}" w:history="1"><w:r>${linkRPr}<w:t xml:space="preserve">${enc(m[1])}</w:t></w:r></w:hyperlink>`;
      last = m.index + m[1].length;
    }
    return out + plain(decoded.slice(last));
  });
}

let lastLogoSize = null;

function imageSize(b) {
  try {
    if (b[0] === 0x89 && b[1] === 0x50) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length) {
        if (b[i] !== 0xff) { i += 1; continue; }
        const marker = b[i + 1];
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
  } catch { /* fall through */ }
  return null;
}

/** Store the uploaded cover logo (data URL) in the package; returns its relationship id. */
async function embedLogo(zip, dataUrl) {
  const m = /^data:image\/(png|jpeg);base64,(.+)$/.exec(dataUrl || '');
  if (!m) return null;
  const ext = m[1] === 'png' ? 'png' : 'jpeg';
  const bytes = Buffer.from(m[2], 'base64');
  let suffix = '';
  for (let i = 1; zip.file(`word/media/paperly-logo${suffix}.${ext}`); i += 1) suffix = `-${i}`;
  const target = `media/paperly-logo${suffix}.${ext}`;
  zip.file(`word/${target}`, bytes);
  const size = imageSize(bytes);
  if (size) lastLogoSize = size;
  let types = await zip.file('[Content_Types].xml').async('string');
  if (!new RegExp(`Extension="${ext}"`, 'i').test(types)) {
    types = types.replace(/<Types\b[^>]*>/, (tag) => `${tag}<Default Extension="${ext}" ContentType="image/${ext}"/>`);
    zip.file('[Content_Types].xml', types);
  }
  const relsPath = 'word/_rels/document.xml.rels';
  let rels = await zip.file(relsPath).async('string');
  let rid = 'rIdPaperlyLogo';
  for (let i = 1; rels.includes(`Id="${rid}"`); i += 1) rid = `rIdPaperlyLogo${i}`;
  rels = rels.replace('</Relationships>', `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${target}"/></Relationships>`);
  zip.file(relsPath, rels);
  return rid;
}

export async function formatDocument(inputBuffer, { config, options = {}, boundaries = null, includeToc = false, meta = {} }) {
  const zip = await readDocxBuffer(inputBuffer);
  let documentXml = await zip.file('word/document.xml').async('string');
  // Older pasted-text documents predate the source marker and carry our
  // Markdown separator shape. Capture it before normalization removes it.
  const pastedText = Boolean(zip.file('rapimakalah/source.json')) || /<v:rect\b[^>]*o:hr="t"/.test(documentXml);
  const hasExplicitLogo = Boolean(meta.logo);
  // Repair the exact quote sequences emitted by the old preface generator,
  // including documents downloaded and uploaded again.
  documentXml = documentXml.replaceAll('\u00e2\u20ac\u0153', '\u201c').replaceAll('\u00e2\u20ac\u009d', '\u201d');
  let stylesXml = (await zip.file('word/styles.xml')?.async('string')) || '';
  let numberingXml = (await zip.file('word/numbering.xml')?.async('string')) || '';
  const styles = parseStyles(stylesXml);
  const operationLog = [];
  const warnings = [];
  const convertedLists = convertTypedNumberedLists(documentXml, numberingXml);
  documentXml = convertedLists.documentXml;
  numberingXml = convertedLists.numberingXml;
  if (convertedLists.count) operationLog.push(`Daftar bernomor teks diubah ke numbering Word (${convertedLists.count} item)`);
  const repairedPipeTables = convertPipeParagraphTables(documentXml);
  documentXml = repairedPipeTables.documentXml;
  if (repairedPipeTables.count) operationLog.push(`Tabel Markdown terdeteksi ulang (${repairedPipeTables.count})`);

  if (options.cover && config.cover?.defaults) {
    const merged = { ...meta };
    for (const [key, value] of Object.entries(config.cover.defaults)) {
      if (key === 'members') {
        if (!(meta.members || []).some((m) => m && String(m.name || '').trim())) merged.members = value;
      } else if (!(key === 'department' && Object.hasOwn(meta, key)) && !String(meta[key] ?? '').trim() && String(value ?? '').trim()) {
        merged[key] = value;
      }
    }
    meta = merged;
  }
  if (options.cover && !meta.logo && config.cover?.logo) {
    meta = { ...meta, logo: config.cover.logo, logoSize: meta.logoSize ?? config.cover.logoSize };
  }
  if (options.cover && meta.logo) {
    lastLogoSize = null;
    const embedded = await embedLogo(zip, meta.logo);
    if (embedded) {
      meta = { ...meta, logoRid: embedded };
      if (lastLogoSize) meta = { ...meta, logoWidth: lastLogoSize.w, logoHeight: lastLogoSize.h };
    }
  }

  const normalized = normalizePastedDocument(documentXml);
  documentXml = normalized.documentXml;
  operationLog.push(...normalized.log);

  // Apply saved cover details to a generic pasted title page. A real name,
  // NIM, institution, table or image makes it an existing cover to preserve.
  if (options.cover && !options.preserveCover && boundaries?.coverEnd === undefined) {
    const pre = getBodyStructure(documentXml);
    const preCover = computeBoundaries(pre.blocks, detectHeadings(pre.blocks, styles)).coverEnd;
    const carrier = preCover !== null ? pre.blocks[preCover] : null;
    if (carrier?.type === 'w:p' && carrier.data && preCover > 0) {
      const coverBlocks = pre.blocks.slice(0, preCover + 1);
      const hasMedia = coverBlocks.some((b) => /<w:drawing\b|<a:blip\b|<v:imagedata\b/.test(b.xml));
      // A logo from the selected format template is a default for generated
      // covers. It must not replace a logo already present in the user's DOCX.
      // An explicitly uploaded workspace logo may still replace it.
      if (hasMedia && meta.logoRid && hasExplicitLogo) {
        // A new logo was uploaded: swap the existing cover picture for it.
        const replaced = replaceCoverPicture(documentXml, coverBlocks, pre, meta);
        if (replaced) {
          documentXml = replaced;
          operationLog.push('Logo cover diganti dengan gambar yang diunggah');
        }
      }
      const lines = coverBlocks.map(b => b.data?.plainText?.trim()).filter(Boolean);
      const genericLine = /^(?:\[.*\]|(?:disusun\s+oleh|penulis|penyusun)\s*:?(?:\s*mahasiswa\b.*)?|mahasiswa\s+program\s+studi\b.*|[\p{L} .]+,\s*(?:\d{1,2}\s+)?(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4})$/iu;
      const isGeneric = lines.slice(1).every(line => genericLine.test(line));
      const hasSavedIdentity = Boolean(meta.logoRid || meta.institution || meta.author || meta.members?.some(m => m?.name?.trim()));
      // Pasted covers use the selected layout even before identity fields are
      // filled. Empty defaults must produce placeholders, not skip the cover.
      if (!hasMedia && (pastedText || (isGeneric && hasSavedIdentity)) && coverBlocks.every((b) => b.type === 'w:p')) {
        // Approval pages belong after the cover, even when pasted without a
        // separator. Retain their text and give them their own page.
        const approval = coverBlocks.find(b => /^(?:LEMBAR|HALAMAN)\s+(?:PENGESAHAN|PERSETUJUAN)$/i.test(b.data?.plainText || ''));
        const keepCarrier = !carrier.data.plainText;
        let rest = pre.bodyInner.slice(approval?.start ?? (keepCarrier ? carrier.start : carrier.end));
        if (approval) rest = setParagraphProperty(approval.xml, 'w:pageBreakBefore', '<w:pageBreakBefore/>') + rest.slice(approval.xml.length);
        const title = /^(?:MAKALAH|HALAMAN SAMPUL|HALAMAN JUDUL)$/i.test(lines[0] || '') ? lines[1] : lines[0];
        const nextInner = buildCoverXml(config, { ...meta, title: title || meta.title }, { pageBreakAfter: !keepCarrier || Boolean(approval) }) + rest;
        documentXml = documentXml.slice(0, pre.bodyRange.openEnd) + nextInner + documentXml.slice(pre.bodyRange.closeStart);
        operationLog.push('Isian cover dari template diterapkan');
      }
    }
  }

  // Tabel anggota cover (caption "RapiMakalah Cover Members") sengaja
  // dipertahankan: border-nya transparan dan kolom nama/NIM menjaga
  // kesejajaran saat anggota bertambah.

  let structure = getBodyStructure(documentXml);
  let headings = detectHeadings(structure.blocks, styles);
  let autoBoundaries = computeBoundaries(structure.blocks, headings);
  if (options.cover || options.preserveCover) {
    const coverEndIndex = boundaries?.coverEnd ?? autoBoundaries.coverEnd;
    let coverChanged = false;
    // Sembunyikan bordernya dan buang baris judul "Nama | NIM" tanpa mengubah
    // tabel isi makalah.
    const normalizedTables = normalizeCoverTables(documentXml, coverEndIndex);
    if (normalizedTables.changed) {
      documentXml = normalizedTables.documentXml;
      operationLog.push('Garis tabel cover disembunyikan');
      coverChanged = true;
    }
    // Cover lama menyimpan anggota sebagai baris "NAMA (NIM)". Ubah menjadi
    // tabel dua kolom supaya nama dan NIM tetap sejajar.
    const coverMembers = (meta.members || []).filter(
      (member) => member && String(member.name || '').trim(),
    );
    if (options.cover && coverMembers.some((member) => String(member.nim || '').trim())) {
      const refreshed = refreshCoverMembers(
        documentXml,
        coverEndIndex,
        coverMembers,
        buildCoverMembersTable(config, coverMembers, { line: 276, makeParagraph: para }),
      );
      if (refreshed.changed) {
        documentXml = refreshed.documentXml;
        operationLog.push('Baris anggota cover dirapikan menjadi tabel');
        coverChanged = true;
      }
    }
    if (coverChanged) {
      structure = getBodyStructure(documentXml);
      headings = detectHeadings(structure.blocks, styles);
      autoBoundaries = computeBoundaries(structure.blocks, headings);
    }
  }
  const resolvedBoundaries = {
    bodyStart: boundaries?.bodyStart ?? autoBoundaries.bodyStart,
    coverEnd: boundaries?.coverEnd ?? autoBoundaries.coverEnd,
    source: boundaries?.bodyStart !== undefined || boundaries?.coverEnd !== undefined ? 'manual' : 'auto',
  };
  if ((options.cover || options.preserveCover) && boundaries?.coverEnd === undefined && resolvedBoundaries.coverEnd === null) {
    const frontMatterStart = structure.blocks.find((block) => block.type === 'w:p' && block.data && (PREFACE_TITLE.test(block.data.plainText) || /^daftar\s+isi$/i.test(block.data.plainText)))?.index;
    if (Number.isInteger(frontMatterStart) && frontMatterStart > 0) resolvedBoundaries.coverEnd = frontMatterStart - 1;
  }
  const roles = headingRoleMap(structure.blocks, headings);
  // Treat the pre-existing plain-text title page as cover content so a TOC
  // added later by the formatter does not cause it to be reclassified as body.
  let preserveCoverEnd = null;
  if (options.preserveCover && resolvedBoundaries.coverEnd === null) {
    const firstFrontMatter = structure.blocks.find((block) =>
      block.type === 'w:p' && block.data &&
      (/^kata\s+pengantar$/i.test(block.data.plainText) || /^daftar\s+isi$/i.test(block.data.plainText))
    );
    if (firstFrontMatter?.index > 0) preserveCoverEnd = firstFrontMatter.index - 1;
  }
  const coverEnd = resolvedBoundaries.coverEnd ?? preserveCoverEnd;

  if (coverEnd === null && !options.preserveCover) {
    warnings.push('Pemisah halaman cover tidak terdeteksi. Format diterapkan ke seluruh paragraf, termasuk halaman judul.');
  }

  const typography = config.typography;
  const headingConfig = {
    1: config.headings.chapter,
    2: config.headings.subheading,
    3: config.headings.subsubheading,
  };
  let formattedParagraphs = 0;

  const bodyStartPos = structure.bodyRange.openEnd;
  const bodyEndPos = structure.bodyRange.closeStart;
  let bodyInner = structure.bodyInner;

  const blocks = structure.blocks;
  const edits = [];
  const institutionBlocks = (options.cover || options.preserveCover) && config.cover?.institutionAtBottom !== false
    ? coverInstitutionBlocks(blocks, coverEnd)
    : [];
  const institutionFirst = institutionBlocks[0] || null;
  const institutionRest = new Set(institutionBlocks.slice(1).map((block) => block.index));

  // Existing "KATA PENGANTAR": normalise title, body and signature block.
  const prefaceIdx = blocks.find((b) => b.type === 'w:p' && b.data && PREFACE_TITLE.test(b.data.plainText) && (coverEnd === null || b.index > coverEnd))?.index ?? null;
  let prefaceRoles = new Map();
  const prefaceEmpty = new Set();
  if (prefaceIdx !== null && options.preface !== false) {
    const next = blocks.find(
      (b) => b.index > prefaceIdx && b.type === 'w:p' && b.data && (/^(daftar\s+(isi|tabel|gambar)|abstrak)$/i.test(b.data.plainText) || roles.has(b.index)),
    );
    const prefaceEnd = next?.index ?? blocks.length;
    prefaceRoles = classifyPrefaceBlocks(blocks, prefaceIdx, prefaceEnd);
    for (const idx of prefaceRoles.keys()) roles.delete(idx);
    // Runs of blank paragraphs push the signature block onto a new page.
    for (let i = prefaceIdx + 1; i < prefaceEnd; i += 1) {
      const b = blocks[i];
      if (b?.type !== 'w:p' || !b.data || b.data.plainText || b.data.hasImage) continue;
      if (b.data.sectionBreak || b.data.pageBreakCount || b.data.pageBreakBefore) continue;
      prefaceEmpty.add(i);
    }
    operationLog.push('Kata pengantar & blok tanda tangan dirapikan');
  }

  // Bibliography entries (after "DAFTAR PUSTAKA"): no numbers, hanging indent.
  const bibEntries = new Set();
  const bibHead = blocks.find((b) => b.type === 'w:p' && b.data && BIB_TITLE.test(b.data.plainText) && roles.has(b.index));
  if (bibHead) {
    for (let i = bibHead.index + 1; i < blocks.length; i += 1) {
      const b = blocks[i];
      if (b.type !== 'w:p' || !b.data || roles.has(i)) break;
      if (b.data.plainText && !b.data.sectionBreak) bibEntries.add(i);
    }
  }

  let bodyLeft = 0;
  let subLeft = 0;
  let listContinuationIndent = null;
  const bibHang = Math.round(((config.bibliography?.hangingIndent ?? 1.27) / 2.54) * 1440);
  const hyperlinks = [];
  const addLink = (url) => {
    const found = hyperlinks.findIndex((h) => h === url);
    if (found >= 0) return 'rIdRapiLink' + (found + 1);
    hyperlinks.push(url);
    return 'rIdRapiLink' + hyperlinks.length;
  };
  const tabLevels = new Set();
  for (const block of blocks) {
    const inCover = (options.cover || options.preserveCover) && coverEnd !== null && block.index <= coverEnd;
    if (institutionRest.has(block.index)) {
      edits.push({ block, xml: '' });
      continue;
    }
    if (institutionFirst && block.index === institutionFirst.index) {
      // Gabungkan beberapa baris institusi lama menjadi satu paragraf agar
      // tidak ada beberapa frame yang masing-masing menempel ke bawah halaman.
      const lines = institutionBlocks.map((candidate) => candidate.data.plainText.trim()).filter(Boolean);
      const xml = lines.length > 1
        ? buildPinnedInstitutionParagraph(config, lines.join('\n'))
        : pinInstitutionParagraph(institutionFirst.xml, config);
      edits.push({ block, xml });
      continue;
    }
    if (inCover && block.type === 'w:tbl') {
      edits.push({ block, xml: normalizeCoverTable(block.xml) });
      continue;
    }
    if (block.type !== 'w:p' || !block.data) continue;
    if (inCover) {
      edits.push({ block, xml: normalizeCoverParagraph(block.xml) });
      continue;
    }
    // An empty paragraph is a block boundary, not a continuation of the prior
    // list item. Clear the carried list indent so following prose returns to
    // the template's normal paragraph indentation.
    if (!block.data.plainText.trim() && !block.data.hasNumbering) {
      listContinuationIndent = null;
    }
    if (prefaceEmpty.has(block.index)) {
      edits.push({ block, xml: '' });
      continue;
    }
    if (prefaceRoles.has(block.index)) {
      edits.push({ block, xml: applyPrefaceRole(block.xml, prefaceRoles.get(block.index), config) });
      formattedParagraphs += 1;
      continue;
    }
    const role = roles.get(block.index) || null;
    if (role) {
      bodyLeft = 0;
      subLeft = 0;
      listContinuationIndent = null;
    }
    const isHeading = Boolean(role);
    const levelConfig = isHeading ? headingConfig[role] || config.headings.subsubheading : null;
    let xml = block.xml;

    if (isHeading && options.headings) {
      const merged = {
        fontFamily: levelConfig.fontFamily || typography.fontFamily,
        fontSize: levelConfig.fontSize,
      };
      if (options.font || options.fontSize) {
        xml = applyTypographyToRuns(xml, {
          fontFamily: options.font ? merged.fontFamily : null,
          fontSize: options.fontSize ? merged.fontSize : null,
        });
      }
      if (typeof levelConfig.bold === 'boolean') xml = applyBold(xml, levelConfig.bold);
      if (levelConfig.uppercase) xml = setCaps(xml, true);
      if (options.alignment) {
        xml = setParagraphProperty(xml, 'w:jc', `<w:jc w:val="${WORD_ALIGN[levelConfig.alignment] || 'center'}"/>`);
      }
      if (options.firstLineIndent) xml = setIndent(xml, 0);
      xml = hangNumberedHeading(xml, role);
      if (role >= 2) {
        const np = /<w:numPr>[\s\S]*?<\/w:numPr>/.exec(xml)?.[0] || '';
        const nid = /<w:numId w:val="(\d+)"/.exec(np)?.[1];
        const lv = /<w:ilvl w:val="(\d+)"/.exec(np)?.[1] ?? '0';
        if (nid) tabLevels.add(nid + ':' + lv);
      }
      bodyLeft = Number(/<w:ind\b[^>]*w:left="(\d+)"/.exec(xml)?.[1] ?? 0);
      subLeft = bodyLeft;
      xml = mergeParagraphSpacing(xml, {
        lineSpacing: options.lineSpacing ? typography.lineSpacing : null,
        before: levelConfig.spaceBefore,
        after: levelConfig.spaceAfter,
        applyLine: options.lineSpacing,
        applySpacing: options.paragraphSpacing,
      });
      const outlineLevel = Math.min(8, Math.max(0, role - 1));
      xml = setParagraphProperty(xml, 'w:outlineLvl', `<w:outlineLvl w:val="${outlineLevel}"/>`);
      formattedParagraphs += 1;
      edits.push({ block, xml });
      continue;
    }

    if (options.font || options.fontSize) {
      xml = applyTypographyToRuns(xml, {
        fontFamily: options.font ? typography.fontFamily : null,
        fontSize: options.fontSize ? typography.fontSize : null,
      });
    }
    if (bibEntries.has(block.index)) {
      xml = xml.replace(/<w:numPr>[\s\S]*?<\/w:numPr>/, '');
      let stripped = false;
      xml = xml.replace(/(<w:t(?:\s[^>]*)?>)([^<]*)/, (m, open, text) => {
        if (stripped) return m;
        stripped = true;
        return open + text.replace(/^\s*(?:\[\d+\]|\d+[.)])\s*/, '');
      });
      if (config.bibliography?.linkUrls !== false) xml = linkifyUrls(xml, addLink);
      xml = setParagraphProperty(xml, 'w:pStyle', '<w:pStyle w:val="Bibliography"/>');
      xml = setParagraphProperty(xml, 'w:jc', `<w:jc w:val="${WORD_ALIGN[config.bibliography?.alignment] || 'both'}"/>`);
      xml = setParagraphProperty(xml, 'w:ind', `<w:ind w:left="${bibHang}" w:right="0" w:hanging="${bibHang}"/>`);
      xml = mergeParagraphSpacing(xml, {
        lineSpacing: typography.lineSpacing,
        before: 0,
        after: 6,
        applyLine: options.lineSpacing,
        applySpacing: true,
      });
      formattedParagraphs += 1;
      edits.push({ block, xml });
      continue;
    }
    // Lettered label (\A. Core\): short, no final period. Flush left so the
    // body below it never starts left of the label, and kept with that body.
    if (isLetteredLabel(block.data)) {
      xml = setParagraphProperty(xml, 'w:jc', '<w:jc w:val="left"/>');
      let split = false;
      xml = xml.replace(/(<w:t(?:\s[^>]*)?>)([A-Z]\.)\s+([^<]*)(<\/w:t>)/, (m, open, lab, rest, close) => {
        if (split) return m;
        split = true;
        return `${open}${lab}${close}<w:tab/><w:t xml:space="preserve">${rest}${close}`;
      });
      xml = setParagraphProperty(xml, 'w:ind', `<w:ind w:left="${subLeft + 425}" w:right="0" w:hanging="425"/>`);
      bodyLeft = subLeft + 425;
      xml = setParagraphProperty(xml, 'w:keepNext', '<w:keepNext/>');
      xml = mergeParagraphSpacing(xml, {
        lineSpacing: typography.lineSpacing,
        before: typography.spaceBefore,
        after: typography.spaceAfter,
        applyLine: options.lineSpacing,
        applySpacing: options.paragraphSpacing,
      });
      formattedParagraphs += 1;
      edits.push({ block, xml });
      continue;
    }
    if (options.alignment) {
      // A justified line ending in a manual break (Shift+Enter) gets stretched
      // across the page; such paragraphs stay left-aligned instead.
      const align = bodyAlignment(block.xml, typography.alignment);
      xml = setParagraphProperty(xml, 'w:jc', `<w:jc w:val="${align}"/>`);
    }
    if (block.data.hasNumbering) {
      xml = applyNumberedListIndent(xml);
      listContinuationIndent = numberedListTextIndent(block.data.ilvl || 0);
    } else if (listContinuationIndent !== null && block.data.plainText.trim()) {
      xml = applyListContinuationIndent(xml, listContinuationIndent);
    } else if (options.firstLineIndent && block.data.plainText) {
      xml = setIndent(xml, typography.firstLineIndent, bodyLeft);
    } else if (options.firstLineIndent) {
      xml = setIndent(xml, 0);
    }
    xml = mergeParagraphSpacing(xml, {
      lineSpacing: typography.lineSpacing,
      before: typography.spaceBefore,
      after: typography.spaceAfter,
      applyLine: options.lineSpacing,
      applySpacing: options.paragraphSpacing,
    });
    formattedParagraphs += 1;
    edits.push({ block, xml });
  }

  const pageDims = PAGE_DIMENSIONS_TWIPS[config.page.size] || PAGE_DIMENSIONS_TWIPS.A4;
  const pageWidthTw = config.page.orientation === 'landscape' ? pageDims.height : pageDims.width;
  const tocTabPos = Math.max(2000, pageWidthTw - cmToTwips(config.page.margins.left) - cmToTwips(config.page.margins.right));
  for (const block of blocks) {
    if (block.type !== 'w:sdt' || !/<w:pStyle w:val="TOC|Table of Contents/.test(block.xml)) continue;
    edits.push({ block, xml: normalizeTocSdt(block.xml, config, tocTabPos, options) });
  }

  // Apply paragraph edits from the end so offsets stay valid.
  for (const edit of edits.sort((a, b) => b.block.start - a.block.start)) {
    bodyInner = bodyInner.slice(0, edit.block.start) + edit.xml + bodyInner.slice(edit.block.end);
  }
  operationLog.push(`Format ${formattedParagraphs} paragraf`);

  // Tabel Markdown tempelan perlu spasi baris template di sel. Hanya tabel
  // ber-caption buatan modul baru yang ditangani; tabel pengguna tidak berubah.
  const formattedTablesXml = formatTextTables(bodyInner, { typography, options });
  if (formattedTablesXml !== bodyInner) {
    bodyInner = formattedTablesXml;
    operationLog.push('Spasi tabel teks diselaraskan dengan template');
  }

  // Font & size inside tables (content text runs only).
  if (options.font || options.fontSize) {
    bodyInner = bodyInner.replace(/<w:tbl\b[\s\S]*?<\/w:tbl>/g, (table) =>
      table.replace(/<w:r(?![A-Za-z])(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g, (run) => {
        if (run.endsWith('/>')) return run;
        let out = run;
        if (options.font) {
          const family = escapeXml(typography.fontFamily);
          out = setRunProperty(
            out,
            'w:rFonts',
            `<w:rFonts w:ascii="${family}" w:hAnsi="${family}" w:eastAsia="${family}" w:cs="${family}"/>`,
          );
        }
        if (options.fontSize) {
          out = setRunProperty(out, 'w:sz', `<w:sz w:val="${Math.round(typography.fontSize * 2)}"/>`);
          out = setRunProperty(out, 'w:szCs', `<w:szCs w:val="${Math.round(typography.fontSize * 2)}"/>`);
        }
        return out;
      }),
    );
    operationLog.push('Font tabel diselaraskan');
  }

  // Cover and table cells are not reformatted, but an indent pushed into the
  // page margin (ruler markers dragged past 0) is always a defect: zero it.
  if (options.firstLineIndent) {
    const fixNegative = (paragraph) =>
      paragraph.replace(/<w:ind\b[^>]*\/>/, (tag) => {
        if (!/w:(?:left|start|right|end)="-/.test(tag)) return tag;
        return mergeTagAttrs(tag, {
          'w:left': /w:left="-/.test(tag) ? 0 : undefined,
          'w:start': /w:start="-/.test(tag) ? null : undefined,
          'w:right': /w:right="-/.test(tag) ? 0 : undefined,
          'w:end': /w:end="-/.test(tag) ? null : undefined,
        });
      });
    bodyInner = bodyInner.replace(/<w:tbl\b[\s\S]*?<\/w:tbl>/g, (table) => table.replace(/<w:p\b[\s\S]*?<\/w:p>/g, fixNegative));
  }

  let updatedXml = documentXml.slice(0, bodyStartPos) + bodyInner + documentXml.slice(bodyEndPos);

  // Page size is always applied; margins only when requested.
  const dims = PAGE_DIMENSIONS_TWIPS[config.page.size] || PAGE_DIMENSIONS_TWIPS.A4;
  const pageSize = {
    width: config.page.orientation === 'landscape' ? dims.height : dims.width,
    height: config.page.orientation === 'landscape' ? dims.width : dims.height,
    orientation: config.page.orientation,
  };
  updatedXml = updatedXml.replace(/<w:sectPr\b[^>]*\/>|<w:sectPr\b[^>]*>[\s\S]*?<\/w:sectPr>/g, (sect) => {
    const selfClosing = sect.endsWith('/>');
    const full = selfClosing ? `<w:sectPr>${sect.slice('<w:sectPr'.length, -2)}</w:sectPr>` : sect;
    return updateSectPr(full, {
      pageSize,
      margins: options.margins ? config.page.margins : null,
    });
  });
  operationLog.push('Ukuran halaman & margin diterapkan');

  if (options.font || options.fontSize) {
    stylesXml = applyDocumentDefaults(stylesXml, config);
    operationLog.push('Default font dokumen diperbarui');
  }

  documentXml = updatedXml;
  structure = getBodyStructure(documentXml);
  headings = detectHeadings(structure.blocks, parseStyles(stylesXml));

  // Auto preface (before the first chapter) and cover (top of the document).
  const firstChapter = () =>
    headings.find((h) => h.level === 1 && /^BAB\b/i.test(h.text))?.blockIndex ?? headings.find((h) => h.level === 1)?.blockIndex ?? null;
  const hasPreface = structure.blocks.some((b) => b.type === 'w:p' && b.data && PREFACE_TITLE.test(b.data.plainText));
  if (options.preface !== false && !hasPreface && firstChapter() !== null) {
    documentXml = insertBeforeBlock(documentXml, firstChapter(), buildPrefaceXml(config, meta));
    operationLog.push('Kata pengantar dibuat otomatis');
    structure = getBodyStructure(documentXml);
    headings = detectHeadings(structure.blocks, parseStyles(stylesXml));
  }
  if (options.cover && coverEnd === null) {
    documentXml = insertAtBodyStart(documentXml, buildCoverXml(config, meta));
    operationLog.push('Halaman cover dibuat otomatis');
    structure = getBodyStructure(documentXml);
    headings = detectHeadings(structure.blocks, parseStyles(stylesXml));
  } else if (options.cover) {
    warnings.push('Dokumen sudah memiliki halaman cover, cover otomatis dilewati.');
  }

  // Table of contents is inserted before the body heading so it belongs to the
  // front matter section.
  if (includeToc && config.toc.enabled) {
    const tocResult = insertTableOfContents(documentXml, structure, config, headings);
    documentXml = tocResult.documentXml;
    if (tocResult.applied) {
      operationLog.push('Field daftar isi disisipkan');
      structure = getBodyStructure(documentXml);
      headings = detectHeadings(structure.blocks, parseStyles(stylesXml));
    }
    warnings.push(...tocResult.warnings);
  }

  // Recompute the section boundary after TOC insertion.
  const tocBoundaries = computeBoundaries(structure.blocks, headings);
  const finalBoundaries =
    resolvedBoundaries.source === 'manual'
      ? resolvedBoundaries
      : { bodyStart: tocBoundaries.bodyStart, coverEnd: tocBoundaries.coverEnd };

  let numberingResult = { applied: false, warnings: [], sections: {} };
  if (options.pageNumbering && config.pageNumbering.enabled) {
    numberingResult = await applyPageNumbering(zip, documentXml, structure, config, {
      ...config.pageNumbering,
      fontFamily: typography.fontFamily,
      fontSize: Math.max(9, typography.fontSize - 1),
    }, finalBoundaries);
    documentXml = numberingResult.documentXml;
    warnings.push(...numberingResult.warnings);
    if (numberingResult.applied) operationLog.push('Section & penomoran halaman diterapkan');
  }

  if (includeToc && config.toc.enabled) {
    const filled = fillTableOfContents(documentXml, stylesXml, config, (await zip.file('word/numbering.xml')?.async('string')) || '');
    if (filled.filled) {
      documentXml = filled.documentXml;
      operationLog.push(`Daftar isi diisi otomatis (${filled.entries} entri)`);
      const idx = warnings.findIndex((w) => w.startsWith('Field daftar isi memerlukan pembaruan'));
      if (idx >= 0) warnings[idx] = 'Nomor halaman daftar isi adalah estimasi RapiMakalah. Di Word, klik kanan daftar isi > Update Field bila ada selisih.';
    }
  }

  if (hyperlinks.length) {
    const relsPath = 'word/_rels/document.xml.rels';
    let rels = (await zip.file(relsPath)?.async('string')) || '';
    rels = rels.replace(/<Relationship\b[^>]*Id="rIdRapiLink\d+"[^>]*\/>/g, '');
    const add = hyperlinks.map((u, i) => '<Relationship Id="rIdRapiLink' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="' + u.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '" TargetMode="External"/>').join('');
    if (rels) zip.file(relsPath, rels.replace('</Relationships>', add + '</Relationships>'));
  }
  if (tabLevels.size) {
    if (numberingXml) numberingXml = setNumberSuffixTab(numberingXml, tabLevels);
  }
  if (numberingXml) zip.file('word/numbering.xml', numberingXml);
  zip.file('word/document.xml', documentXml);
  if (stylesXml) zip.file('word/styles.xml', stylesXml);
  const settings = await zip.file('word/settings.xml')?.async('string');
  if (settings && (includeToc || options.pageNumbering)) {
    zip.file('word/settings.xml', setNoExpandShiftReturn(settings));
  }

  const finalStructure = getBodyStructure(documentXml);
  const finalStyles = parseStyles(stylesXml);
  const finalHeadings = detectHeadings(finalStructure.blocks, finalStyles);
  const stats = computeStats(finalStructure.blocks, finalHeadings);
  const pageEstimate = estimatePageCount(stats, config);
  const sections = getSectionProperties(finalStructure.blocks);

  // Dokumen lama bisa memiliki part tanpa content type (mis. source.json),
  // yang membuat Word menolak file. Tambal sebelum paket ditulis.
  await ensureContentTypes(zip);
  const output = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });

  return {
    buffer: output,
    report: {
      appliedRules: operationLog,
      warnings,
      headings: finalHeadings,
      stats: { ...stats, ...pageEstimate },
      sections: sections.map((s) => ({
        margins: s.margins,
        numFmt: s.numFmt,
        numStart: s.numStart,
        hasFooter: s.hasFooterReference,
      })),
      boundaries: finalBoundaries,
    },
  };
}

function insertTableOfContents(documentXml, structure, config, headings) {
  if (/<w:instrText\b[^>]*>\s*TOC\s/.test(documentXml)) {
    return { documentXml, applied: false, warnings: ['Dokumen sudah memiliki field daftar isi. Penyisipan dilewati agar tidak terjadi duplikasi.'] };
  }
  const bodyStart = headings.find((h) => h.level === 1 && /^BAB\b/i.test(h.text))?.blockIndex ?? headings.find((h) => h.level === 1)?.blockIndex ?? null;
  if (bodyStart === null) {
    return {
      documentXml,
      applied: false,
      warnings: ['Daftar isi tidak dibuat karena tidak ada heading level 1 yang terdeteksi. Gunakan style Heading 1 atau awali judul bab dengan "BAB".'],
    };
  }
  const headingCfg = config.headings.chapter;
  const fontFamily = escapeXml(headingCfg.fontFamily || config.typography.fontFamily);
  const half = Math.round(headingCfg.fontSize * 2);
  const depth = Math.min(5, Math.max(1, config.toc.depth || 3));
  const title = escapeXml(config.toc.title || 'DAFTAR ISI');
  const tocInstruction = ` TOC \\o "1-${depth}" \\h \\z \\u `;
  const titleXml = `<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:keepNext/><w:pageBreakBefore/><w:spacing w:before="0" w:after="240" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/><w:outlineLvl w:val="0"/><w:rPr><w:rFonts w:ascii="${fontFamily}" w:hAnsi="${fontFamily}"/><w:b/><w:bCs/><w:sz w:val="${half}"/><w:szCs w:val="${half}"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="${fontFamily}" w:hAnsi="${fontFamily}"/><w:b/><w:bCs/><w:sz w:val="${half}"/><w:szCs w:val="${half}"/></w:rPr><w:t>${title}</w:t></w:r></w:p>`;
  const fieldXml = `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="360" w:lineRule="auto"/></w:pPr><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r><w:r><w:instrText xml:space="preserve">${tocInstruction}</w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">Daftar isi akan diperbarui saat dokumen dibuka di Microsoft Word (klik kanan &gt; Update Field). Nomor halaman belum dihitung oleh RapiMakalah.</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>`;

  const body = getInner(documentXml, 'w:body');
  if (!body) return { documentXml, applied: false, warnings: ['Struktur body tidak dikenali.'] };

  // Reuse an existing "DAFTAR ISI" heading if present; otherwise add a title
  // and start the TOC on a fresh page before the first chapter.
  const existingTocHeading = headings.find((h) => /^daftar isi$/i.test(h.text.trim()) && h.blockIndex < bodyStart);
  let bodyXml = body.inner;
  if (existingTocHeading) {
    const block = structure.blocks[existingTocHeading.blockIndex];
    bodyXml = bodyXml.slice(0, block.end) + fieldXml + bodyXml.slice(block.end);
  } else {
    const block = structure.blocks[bodyStart];
    bodyXml = bodyXml.slice(0, block.start) + titleXml + fieldXml + bodyXml.slice(block.start);
  }
  const updated = documentXml.slice(0, body.range.openEnd) + bodyXml + documentXml.slice(body.range.closeStart);
  return {
    documentXml: updated,
    applied: true,
    warnings: ['Field daftar isi memerlukan pembaruan di Microsoft Word. RapiMakalah tidak melakukan pagination, sehingga nomor halaman belum dapat dijamin akurat.'],
  };
}

export { applyDocumentDefaults, computeBoundaries, isBareBab, textParagraph };
