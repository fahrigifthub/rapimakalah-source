import { getAttr, getInner, scanChildren } from './xml.js';
import {
  PAGE_DIMENSIONS_TWIPS,
  detectHeadings,
  extractPreviewImages,
  getBodyStructure,
  getDocumentRelsPath,
  getSectionProperties,
  parseParagraph,
  parseStyles,
  readDocxBuffer,
  textFromXml,
} from './reader.js';

import { ommlToMathml } from './mathml.js';
import { convertPreviewMath, preparePreviewMath } from './previewMath.js';

const MAX_TEXT_BLOCK = 4000;
const TWIPS_PER_CM = 567;
const PREFACE_TITLE = /^kata\s+pengantar$/i;

function runsForPreview(paragraphXml) {
  const runs = [];
  const re = /<m:oMathPara\b[\s\S]*?<\/m:oMathPara>|<m:oMath\b[\s\S]*?<\/m:oMath>|<w:hyperlink\b[^>]*>[\s\S]*?<\/w:hyperlink>|<w:r(?![A-Za-z])(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g;
  let m;
  while ((m = re.exec(paragraphXml))) {
    const xml = m[0];
    const isLink = xml.startsWith('<w:hyperlink');
    if (xml.startsWith('<m:')) {
      runs.push({ text: '', math: ommlToMathml(xml), display: xml.startsWith('<m:oMathPara') });
      continue;
    }
    const withoutProps = xml.replace(/<w:rPr>[\s\S]*?<\/w:rPr>/, '');
    const text = textFromXml(withoutProps);
    if (!text) continue;
    const style = {
      text,
      link: isLink && /^https?:\/\//.test(text) ? text : undefined,
      bold: /<w:b\b/.test(xml),
      italic: /<w:i\b/.test(xml),
      underline: /<w:u\b/.test(xml),
      superscript: /<w:vertAlign\b[^>]*w:val="superscript"/.test(xml),
      subscript: /<w:vertAlign\b[^>]*w:val="subscript"/.test(xml),
      caps: /<w:caps\b(?![^>]*w:val="(?:0|false)")/.test(xml),
      size: /<w:sz w:val="(\d+)"/.exec(xml) ? Number(/<w:sz w:val="(\d+)"/.exec(xml)[1]) / 2 : null,
    };
    text.split('\f').forEach((part, index) => {
      if (index) runs.push({ text: '', pageBreak: true });
      if (part) runs.push({ ...style, text: part });
    });
    if (runs.length > 400) break;
  }
  return convertPreviewMath(runs);
}

function tabsForPreview(paragraphXml) {
  const block = /<w:pPr>[\s\S]*?<w:tabs>([\s\S]*?)<\/w:tabs>/.exec(paragraphXml);
  if (!block) return null;
  const tabs = [];
  for (const m of block[1].matchAll(/<w:tab\b([^>]*)\/>/g)) {
    const val = /w:val="(\w+)"/.exec(m[1])?.[1];
    const pos = /w:pos="(-?\d+)"/.exec(m[1])?.[1];
    if (!val || val === 'clear' || pos === undefined) continue;
    tabs.push({ val, pos: Number(pos) / TWIPS_PER_CM, leader: /w:leader="(\w+)"/.exec(m[1])?.[1] || 'none' });
  }
  return tabs.length ? tabs : null;
}

function imageRefs(blockXml) {
  const ids = [];
  for (const m of blockXml.matchAll(/<a:blip\b[^>]*r:embed="([^"]+)"/g)) ids.push(m[1]);
  for (const m of blockXml.matchAll(/<v:imagedata\b[^>]*r:id="([^"]+)"/g)) ids.push(m[1]);
  return [...new Set(ids)];
}

/** Drawing sizes in cm (from wp:extent), in document order. */
function imageSizes(blockXml) {
  return [...blockXml.matchAll(/<wp:extent\b[^>]*cx="(\d+)"[^>]*cy="(\d+)"/g)].map((m) => ({ w: Number(m[1]) / 360000, h: Number(m[2]) / 360000 }));
}

function tableForPreview(tableXml, images) {
  const rows = [];
  let headerRows = 0;
  const rowRe = /<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/g;
  let rowMatch;
  while ((rowMatch = rowRe.exec(tableXml)) && rows.length < 40) {
    if (/<w:tblHeader\b/.test(rowMatch[0])) headerRows = rows.length + 1;
    const cells = [];
    const cellRe = /<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/g;
    let cellMatch;
    while ((cellMatch = cellRe.exec(rowMatch[1])) && cells.length < 12) {
      const text = textFromXml(cellMatch[1].replace(/<w:tcPr>[\s\S]*?<\/w:tcPr>/, '')).replace(/\s+/g, ' ').trim();
      const align = /<w:jc w:val="([a-z]+)"\/>/.exec(cellMatch[1])?.[1] || null;
      const refs = imageRefs(cellMatch[1]);
      cells.push({ text, align, images: refs.map((id) => images[id]).filter(Boolean).slice(0, 2) });
    }
    rows.push(cells);
  }
  return { rows, headerRows };
}

/**
 * Parse word/numbering.xml into Map(numId -> Map(ilvl -> level info)).
 * Used by the preview to reproduce list indents and markers the way Word does.
 */
export function parseNumbering(numberingXml) {
  const map = new Map();
  if (!numberingXml) return map;
  const abstracts = new Map();
  const absRe = /<w:abstractNum\b[^>]*w:abstractNumId="(\d+)"[^>]*>([\s\S]*?)<\/w:abstractNum>/g;
  let m;
  while ((m = absRe.exec(numberingXml))) {
    const levels = new Map();
    const lvlRe = /<w:lvl\b[^>]*w:ilvl="(\d+)"[^>]*>([\s\S]*?)<\/w:lvl>/g;
    let l;
    while ((l = lvlRe.exec(m[2]))) {
      const inner = l[2];
      const indTag = inner.match(/<w:ind\b[^>]*\/?>/)?.[0] || '';
      const fmtTag = inner.match(/<w:numFmt\b[^>]*\/?>/)?.[0] || '';
      const textTag = inner.match(/<w:lvlText\b[^>]*\/?>/)?.[0] || '';
      const startTag = inner.match(/<w:start\b[^>]*\/?>/)?.[0] || '';
      levels.set(Number(l[1]), {
        numFmt: getAttr(fmtTag, 'w:val') || 'decimal',
        lvlText: textTag ? getAttr(textTag, 'w:val') ?? '' : '%1.',
        start: Number(getAttr(startTag, 'w:val') || 1),
        left: Number(getAttr(indTag, 'w:left') || 0),
        hanging: Number(getAttr(indTag, 'w:hanging') || 0),
      });
    }
    abstracts.set(m[1], levels);
  }
  const numRe = /<w:num\b[^>]*w:numId="(\d+)"[^>]*>([\s\S]*?)<\/w:num>/g;
  while ((m = numRe.exec(numberingXml))) {
    const absId = /w:abstractNumId\s+w:val="(\d+)"/.exec(m[2])?.[1];
    const levels = absId ? abstracts.get(absId) : null;
    if (levels) map.set(m[1], levels);
  }
  return map;
}

function toRoman(n) {
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}

function formatPageNumber(n, fmt) {
  if (fmt === 'upperRoman') return toRoman(n);
  if (fmt === 'lowerRoman') return toRoman(n).toLowerCase();
  if (fmt === 'upperLetter') return String.fromCharCode(64 + ((n - 1) % 26) + 1);
  if (fmt === 'lowerLetter') return String.fromCharCode(96 + ((n - 1) % 26) + 1);
  return String(n);
}

export function buildPreviewPages(documentXml, styles, config, images = {}, numberingMap = null, options = {}) {
  // Word stores its own layout trace in <w:lastRenderedPageBreak/>. Converting
  // those into real page breaks reproduces Word's pagination for the original
  // file — but only the original: after formatting, those marks are stale.
  const prepared = preparePreviewMath(documentXml);
  const xml = options.useRenderedBreaks
    ? prepared.replace(/<w:lastRenderedPageBreak\b[^>]*\/>/g, '<w:br w:type="page"/>')
    : prepared;
  const structure = getBodyStructure(xml);
  const headings = detectHeadings(structure.blocks, styles);
  const headingMap = new Map(headings.map((h) => [h.blockIndex, h.level]));
  const formatOptions = options.formatOptions || options;
  const formatted = Boolean(options.formatted);
  const isCoverEnabled = Boolean(options.formatted && formatOptions.cover);
  const firstBodyHeading = headings.find((h) => h.level === 1 && /^BAB\b/i.test(h.text));
  const bodyStart = firstBodyHeading?.blockIndex ?? headings.find((h) => h.level === 1)?.blockIndex ?? null;
  const prefaceStart = structure.blocks.find((block) => block.type === 'w:p' && block.data && /^kata\s+pengantar$/i.test(block.data.plainText))?.index ?? null;
  const hasCoverMedia = structure.blocks.some((block) => /<w:drawing\b|<a:blip\b|<v:imagedata\b/.test(block.xml));
  const tocStart = structure.blocks.find((block) => block.type === 'w:p' && block.data && /^daftar\s+isi$/i.test(block.data.plainText))?.index ?? null;
  const coverFrontMatterStart = [prefaceStart, tocStart].filter(Number.isInteger).sort((a, b) => a - b)[0] ?? null;
  const coverLimit = [prefaceStart, tocStart, bodyStart].filter(Number.isInteger).sort((a, b) => a - b)[0] ?? null;
  let coverEnd = null;
  if (coverLimit !== null) {
    for (const block of structure.blocks) {
      if (block.index >= coverLimit) break;
      if (block.type !== 'w:p' || !block.data) continue;
      if (block.data.sectionBreak || block.data.pageBreakCount > 0 || block.data.pageBreakBefore) {
        coverEnd = block.index;
        break;
      }
    }
    if (coverFrontMatterStart !== null && (isCoverEnabled || hasCoverMedia) && (coverEnd === null || coverEnd >= coverFrontMatterStart)) coverEnd = coverFrontMatterStart - 1;
  } else {
    for (const block of structure.blocks) {
      if (block.type !== 'w:p' || !block.data) continue;
      if (block.data.sectionBreak || block.data.pageBreakCount > 0 || block.data.pageBreakBefore) {
        coverEnd = block.index;
        break;
      }
    }
  }

  const page = config.page;
  const sections = getSectionProperties(structure.blocks);
  const docSect = sections.find((s) => s.width && s.height) || null;
  const twToCm = (tw) => (tw / 1440) * 2.54;
  const configDims = PAGE_DIMENSIONS_TWIPS[page.size] || PAGE_DIMENSIONS_TWIPS.A4;
  const configWidthTw = page.orientation === 'landscape' ? configDims.height : configDims.width;
  const configHeightTw = page.orientation === 'landscape' ? configDims.width : configDims.height;
  // Formatting always applies page size; margins follow the user's checkbox.
  // Use the effective template values for processed previews instead of letting
  // source DOCX geometry make equivalent text/DOCX inputs look inconsistent.
  const widthCm = twToCm(formatted ? configWidthTw : (docSect?.width || configWidthTw));
  const heightCm = twToCm(formatted ? configHeightTw : (docSect?.height || configHeightTw));
  const docMargins = docSect?.margins || null;
  const margins = formatted && formatOptions.margins
    ? page.margins
    : docMargins
      ? {
          top: twToCm(docMargins.top),
          right: twToCm(docMargins.right),
          bottom: twToCm(docMargins.bottom),
          left: twToCm(docMargins.left),
        }
      : page.margins;
  const usableWidth = Math.max(4, widthCm - margins.left - margins.right);
  const usableHeight = Math.max(4, heightCm - margins.top - margins.bottom);
  const typography = config.typography;
  const effectiveFontSize = formatted && formatOptions.fontSize ? typography.fontSize : null;
  const effectiveLineSpacing = formatted && formatOptions.lineSpacing ? typography.lineSpacing : null;
  const avgCharCm = (effectiveFontSize || typography.fontSize) * 0.0176;
  const charsPerLine = Math.max(20, Math.floor(usableWidth / avgCharCm));
  const lineHeightCm = (effectiveFontSize || typography.fontSize) * 0.0353 * (effectiveLineSpacing || typography.lineSpacing);
  const linesPerPage = Math.max(10, Math.floor(usableHeight / lineHeightCm));

  const pages = [];
  let current = { number: 1, blocks: [] };
  let usedLines = 0;
  let lastWasBody = false;
  // Breaks are queued and applied only when real content follows, so a run of
  // empty break-carrier paragraphs never produces phantom blank pages.
  let pendingBreak = false;
  const listCounters = new Map();

  const newPage = () => {
    if (current.blocks.length) pages.push(current);
    current = { number: pages.length + 1, blocks: [] };
    usedLines = 0;
  };

  let sectionIdx = 0;
  const blockLines = new WeakMap();
  const pushBlock = (block, lines = 0) => {
    if (usedLines > 0 && usedLines + lines > linesPerPage) {
      // Word's bottom-anchored signature paragraphs form one frame. Keep
      // date, label and name together when the frame needs another page.
      const signature = [];
      if (block.bottomFrame) {
        while (current.blocks.at(-1)?.bottomFrame) signature.unshift(current.blocks.pop());
      }
      while (current.blocks.at(-1)?.keepNext && usedLines + lines <= linesPerPage * 2) signature.unshift(current.blocks.pop());
      const signatureSection = current.sectionIdx;
      newPage();
      if (signature.length) current.sectionIdx = signatureSection;
      for (const part of signature) {
        current.blocks.push(part);
        usedLines += blockLines.get(part);
      }
    }
    if (!current.blocks.length) current.sectionIdx = sectionIdx;
    current.blocks.push(block);
    const occupiedLines = Math.max(1, lines);
    blockLines.set(block, occupiedLines);
    usedLines += occupiedLines;
  };

  // Resolve list indent + marker for a numbered paragraph (numbering.xml).
  const listInfoFor = (p) => {
    const empty = { left: 0, hanging: 0, marker: null };
    if (!p.numId || !numberingMap?.size) return empty;
    const levels = numberingMap.get(p.numId);
    const lvl = levels?.get(p.ilvl) || null;
    if (!lvl) return empty;
    let counters = listCounters.get(p.numId);
    if (!counters) {
      counters = [];
      listCounters.set(p.numId, counters);
    }
    counters[p.ilvl] = (counters[p.ilvl] ?? lvl.start - 1) + 1;
    counters.length = p.ilvl + 1;
    let marker = null;
    if (lvl.numFmt !== 'none' && lvl.lvlText !== '') {
      marker = lvl.lvlText.replace(/%(\d)/g, (all, d) => {
        const value = counters[Number(d) - 1];
        return value === undefined ? '' : String(value);
      });
    }
    return { left: lvl.left, hanging: lvl.hanging, marker };
  };

  const processParagraph = (block, key) => {
    const p = block.data;
    const bottomFrame = /<w:framePr\b[^>]*w:yAlign="bottom"/.test(block.xml);
    // Uploaded DOCX files can have their bottom institution block after a
    // page-break carrier or a misclassified cover boundary. Its explicit
    // bottom frame plus institution label is reliable evidence that it belongs
    // to the cover, and lets the preview anchor it to the page bottom too.
    const institutionFrame = bottomFrame && /PROGRAM\s+STUDI|FAKULTAS|UNIVERSITAS/i.test(p.plainText);
    const inCover = isCoverEnabled && ((coverEnd !== null && block.index <= coverEnd) || institutionFrame);
    if (bodyStart !== null && block.index === bodyStart && !lastWasBody) {
      pendingBreak = true;
      lastWasBody = true;
    }
    const segments = [[]];
    for (const run of runsForPreview(block.xml)) {
      if (run.pageBreak) segments.push([]);
      else segments.at(-1).push(run);
    }
    let pageBreakBefore = p.pageBreakBefore;
    if (!/<w:pageBreakBefore\b/.test(block.xml)) {
      const seen = new Set();
      let style = styles.get(p.styleId);
      while (style && !seen.has(style.styleId)) {
        seen.add(style.styleId);
        if (style.pageBreakBefore != null) { pageBreakBefore = style.pageBreakBefore; break; }
        style = styles.get(style.basedOn);
      }
    }
    const listInfo = p.hasNumbering ? listInfoFor(p) : { left: 0, hanging: 0, marker: null };
    // A paragraph-level indent overrides the matching numbering indent.
    const leftTwips = p.leftIndent || listInfo.left;
    const hangingTwips = p.hangingIndent || listInfo.hanging;

    segments.forEach((segmentRuns, segIndex) => {
      const segmentText = segmentRuns.map(run => run.text || '').join('');
      const text = segmentText.replace(/\n/g, ' ').trimEnd();
      const isHeading = headingMap.has(block.index) && segIndex === segments.length - 1;
      const hasContent = Boolean(text) || segmentRuns.some(run => run.math) || (segIndex === 0 && p.hasImage) || isHeading;
      // A page break sits between the previous segment and this one; a
      // pageBreakBefore sits before the first segment.
      if (segIndex > 0 || (segIndex === 0 && pageBreakBefore)) pendingBreak = true;
      // Empty paragraphs (including pure break carriers) only queue a break —
      // they must not start a page on their own.
      if (!hasContent) return;
      if (pendingBreak) {
        newPage();
        pendingBreak = false;
      }
      const mathLines = segmentRuns.reduce((sum, run) => sum + (run.math ? (run.display ? 3 : 0.5) : 0), 0);
      const refs = imageRefs(block.xml);
      const previewBlock = {
        id: `${key}-${segIndex}`,
        blockIndex: block.index,
        type: 'paragraph',
        text: text.slice(0, MAX_TEXT_BLOCK),
        runs: segmentRuns,
        alignment: inCover
          ? 'center'
          : bottomFrame ? (p.alignment || 'right')
          : formatted && formatOptions.alignment
            ? (isHeading
                ? ({ 1: config.headings.chapter, 2: config.headings.subheading, 3: config.headings.subsubheading }[headingMap.get(block.index)]?.alignment || typography.alignment)
                : typography.alignment)
            : p.alignment,
        bottomFrame,
        keepNext: /<w:keepNext\b(?![^>]*w:val="(?:0|false|off)")/.test(block.xml) && !bottomFrame,
        headingLevel: isHeading ? headingMap.get(block.index) : null,
        styleId: p.styleId,
        firstLineIndent: inCover || bottomFrame ? null : p.hasExplicitFirstLineIndent ? (p.firstLineIndent ? p.firstLineIndent / TWIPS_PER_CM : null) : !hangingTwips && p.firstLineIndent ? p.firstLineIndent / TWIPS_PER_CM : formatted && formatOptions.firstLineIndent && !p.hasNumbering && !isHeading ? typography.firstLineIndent : null,
        leftIndent: inCover ? null : leftTwips ? leftTwips / TWIPS_PER_CM : null,
        hangingIndent: inCover ? null : hangingTwips ? hangingTwips / TWIPS_PER_CM : null,
        numberMarker: inCover ? null : segIndex === 0 ? listInfo.marker : null,
        tabs: tabsForPreview(block.xml),
        lineRule: p.lineRule,
        lineSpacing: effectiveLineSpacing ? Math.round(effectiveLineSpacing * 240) : p.lineSpacing,
        spaceBefore: formatted && formatOptions.paragraphSpacing && isHeading
          ? ({ 1: config.headings.chapter, 2: config.headings.subheading, 3: config.headings.subsubheading }[headingMap.get(block.index)]?.spaceBefore ?? typography.spaceBefore)
          : p.spaceBefore ? p.spaceBefore / 20 : null,
        spaceAfter: formatted && formatOptions.paragraphSpacing && isHeading
          ? ({ 1: config.headings.chapter, 2: config.headings.subheading, 3: config.headings.subsubheading }[headingMap.get(block.index)]?.spaceAfter ?? typography.spaceAfter)
          : p.spaceAfter ? p.spaceAfter / 20 : null,
        hasNumbering: p.hasNumbering && !inCover,
        hasImage: p.hasImage,
        imageSizes: segIndex === 0 ? imageSizes(block.xml) : [],
        images: segIndex === 0 ? refs.map((id) => images[id]).filter(Boolean).slice(0, 3) : [],
        isCover: inCover,
        pageBreakBefore: Boolean(pageBreakBefore && segIndex === 0),
      };
      if (bottomFrame) {
        // Let the signature follow the preface instead of pinning it to the
        // page bottom. Keep writing space only between the label and name.
        const previous = structure.blocks[block.index - 1];
        const next = structure.blocks[block.index + 1];
        const label = /^(penulis|penyusun|hormat kami|kelompok\s*\d*)[,.]?$/i;
        previewBlock.spaceBefore = /<w:framePr\b/.test(previous?.xml || '') ? 0 : 12;
        previewBlock.spaceAfter = label.test(text) ? 36
          : /<w:framePr\b/.test(next?.xml || '') && !label.test(next?.data?.plainText || '') ? 36 : 0;
      }
      if (previewBlock.text.length > MAX_TEXT_BLOCK) {
        previewBlock.truncated = true;
        previewBlock.text = `${previewBlock.text.slice(0, MAX_TEXT_BLOCK)}…`;
      }
      // Estimate the same occupied area as the preview: hanging/list indents
      // narrow wrapped lines, words wrap before the edge, and paragraph gaps
      // consume page space even though they contain no characters.
      const headingSize = isHeading
        ? ({ 1: config.headings.chapter, 2: config.headings.subheading, 3: config.headings.subsubheading }[previewBlock.headingLevel]?.fontSize || typography.fontSize)
        : effectiveFontSize || typography.fontSize;
      const availableWidth = Math.max(1, usableWidth - (previewBlock.leftIndent || 0));
      const capacity = Math.max(1, Math.floor(availableWidth / (headingSize * 0.0176)));
      let wrappedLines = 0;
      for (const line of segmentText.split('\n')) {
        let occupied = Math.max(0, Math.ceil((previewBlock.firstLineIndent || 0) / (headingSize * 0.0176)));
        let count = 1;
        for (const word of line.split(/\s+/).filter(Boolean)) {
          const gap = occupied ? 1 : 0;
          if (occupied && occupied + gap + word.length > capacity) { count += 1; occupied = 0; }
          occupied += (occupied ? 1 : 0) + word.length;
          if (occupied > capacity) {
            count += Math.floor((occupied - 1) / capacity);
            occupied = ((occupied - 1) % capacity) + 1;
          }
        }
        wrappedLines += count;
      }
      const blockLineHeight = headingSize * 0.0353 * (previewBlock.lineSpacing ? previewBlock.lineSpacing / 240 : effectiveLineSpacing || typography.lineSpacing);
      const gapCm = isHeading
        ? typography.fontSize * 0.0353 * 1.1
        : ((previewBlock.spaceBefore || 0) + (previewBlock.spaceAfter || 0)) * 0.0353;
      const lines = ((wrappedLines + mathLines) * blockLineHeight + gapCm) / lineHeightCm;
      pushBlock(previewBlock, lines);
    });

    // A section break (nextPage/oddPage/evenPage) ends the current page in
    // Word; queue the break so the next real content starts a new page.
    if (p.sectionBreak) sectionIdx += 1;
    if (p.sectionBreak && p.sectionBreak !== 'continuous' && p.sectionBreak !== 'nextColumn') {
      pendingBreak = true;
    }
  };

  const processTable = (block, key) => {
    const inCover = isCoverEnabled && coverEnd !== null && block.index <= coverEnd;
    if (pendingBreak) {
      newPage();
      pendingBreak = false;
    }
    const { rows, headerRows } = tableForPreview(block.xml, images);
    const rowCount = rows.length || 1;
    const lines = Math.min(linesPerPage, rowCount * 2);
    pushBlock(
      {
        id: key,
        blockIndex: block.index,
        type: 'table',
        isMemberTable: /<w:tblCaption\b[^>]*w:val="RapiMakalah Cover Members"/.test(block.xml),
        rows,
        headerRows,
        isEmpty: rows.length === 0,
        isCover: inCover,
      },
      lines,
    );
  };

  for (const block of structure.blocks) {
    if (block.type === 'w:p' && block.data) {
      processParagraph(block, `b${block.index}`);
    } else if (block.type === 'w:tbl') {
      processTable(block, `t${block.index}`);
    } else if (block.type === 'w:sdt') {
      // Structured document tags (the TOC content control) wrap real
      // paragraphs — render them instead of showing an empty page.
      const content = getInner(block.xml, 'w:sdtContent');
      if (!content || content.range.selfClosing) continue;
      scanChildren(content.inner).forEach((child, childIdx) => {
        if (child.name === 'w:p') {
          processParagraph({ ...child, index: block.index, data: parseParagraph(child.xml, block.index) }, `s${block.index}c${childIdx}`);
        } else if (child.name === 'w:tbl') {
          processTable({ ...child, index: block.index }, `s${block.index}t${childIdx}`);
        }
      });
    }
  }
  if (current.blocks.length) pages.push(current);

  // Page labels follow the real section numbering (pgNumType + footer).
  let counter = 0;
  let fmt = 'decimal';
  let lastSect = -1;
  for (const pg of pages) {
    const sIdx = Math.min(pg.sectionIdx ?? 0, sections.length - 1);
    const sect = sections[sIdx];
    const firstOfSection = sIdx !== lastSect;
    lastSect = sIdx;
    if (sect?.numStart && firstOfSection) {
      counter = sect.numStart;
      fmt = sect.numFmt || 'decimal';
    } else {
      counter += 1;
      if (sect?.numFmt) fmt = sect.numFmt;
    }
    pg.pageLabel = sect?.hasFooterReference ? formatPageNumber(counter, fmt) : null;
  }

  return {
    pages,
    pageCount: pages.length,
    estimated: true,
    headings,
    bodyStartBlock: bodyStart,
    meta: {
      pageSize: page.size,
      orientation: widthCm > heightCm ? 'landscape' : 'portrait',
      widthCm,
      heightCm,
      margins,
      fontFamily: config.typography.fontFamily,
      fontSize: config.typography.fontSize,
      lineSpacing: config.typography.lineSpacing,
      charsPerLine,
      linesPerPage,
    },
    limitations: [
      'Pratinjau ini dirender oleh RapiMakalah dari struktur OOXML, bukan mesin layout Microsoft Word.',
      'Pagination bersifat estimasi; posisi halaman dan nomor halaman final ditentukan Word saat dokumen dibuka.',
      'Tabel kompleks (merge sel, border), text box, dan shape ditampilkan secara disederhanakan.',
    ],
  };
}

export async function createPreview(buffer, config, variant = 'original', formatOptions = {}) {
  const zip = await readDocxBuffer(buffer);
  const documentXml = await zip.file('word/document.xml').async('string');
  const stylesXml = (await zip.file('word/styles.xml')?.async('string')) || '';
  const numberingXml = (await zip.file('word/numbering.xml')?.async('string')) || '';
  const rels = await zip.file(getDocumentRelsPath())?.async('string');
  const images = await extractPreviewImages(zip, rels);
  return {
    variant,
    ...buildPreviewPages(documentXml, parseStyles(stylesXml), config, images, parseNumbering(numberingXml), {
      useRenderedBreaks: variant === 'original',
      formatted: variant === 'processed',
      formatOptions,
    }),
  };
}

export { parseParagraph };
