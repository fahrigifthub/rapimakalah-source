import mammoth from 'mammoth';
import sanitizeHtml from 'sanitize-html';
import { getAttr } from './xml.js';
import { getBodyStructure, getSectionProperties, parseParagraph, parseStyles, readDocxBuffer } from './reader.js';
import { parseNumbering } from './preview.js';
import { randomUUID } from 'node:crypto';
import { ommlToMathml } from './mathml.js';

const TOC_STYLE = /^(TOC\s*\d*|RapiMakalah TOC|Table of Contents|Daftar Isi\s*\d*)$/i;

export async function importWritingDocx(buffer) {
  const paragraphFormats = [];
  const headingCounters = new Map();
  const zip = await readDocxBuffer(buffer);
  const documentXml = await zip.file('word/document.xml').async('string');
  const stylesXml = await zip.file('word/styles.xml')?.async('string') || '';
  const numberingXml = await zip.file('word/numbering.xml')?.async('string') || '';
  const styleDefinitions = parseStyles(stylesXml);
  const numbering = parseNumbering(numberingXml);
  const structure = getBodyStructure(documentXml);
  const sections = getSectionProperties(structure.blocks);
  const paragraphMetadata = [];
  const tokens = new Map();
  const prefix = `RM${randomUUID().replaceAll('-', '')}`;
  const token = html => { const key = `${prefix}X${tokens.size}Z`; tokens.set(key, html); return key; };
  const run = text => `<w:r><w:t xml:space="preserve">${text}</w:t></w:r>`;
  const preparedXml = documentXml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, xml => {
    const metadata = parseParagraph(xml, paragraphMetadata.length);
    paragraphMetadata.push(metadata);
    let prepared = xml.replace(/<m:oMathPara\b[\s\S]*?<\/m:oMathPara>|<m:oMath\b[\s\S]*?<\/m:oMath>/g, math => run(token(`<span data-writing-math="${escapeAttribute(ommlToMathml(math))}" data-omml="${escapeAttribute(math)}"></span>`)));
    prepared = prepared.replace(/<w:br\b[^>]*w:type=["']page["'][^>]*\/?\s*>|<w:lastRenderedPageBreak\b[^>]*\/?\s*>/g, () => `<w:t>${token('<div data-page-break-before="1"></div>')}</w:t>`);
    prepared = prepared.replace(/<w:tab\s*\/>/g, () => `<w:t>${token('<span data-writing-tab="1"></span>')}</w:t>`);
    const marker = run(`${prefix}P${paragraphMetadata.length - 1}Z`);
    return prepared.replace(/<\/w:p>$/, `${marker}</w:p>`);
  });
  zip.file('word/document.xml', preparedXml);
  const convertedBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  const result = await mammoth.convertToHtml({ buffer: convertedBuffer }, {
    transformDocument: mammoth.transforms.paragraph(paragraph => {
      const metadata = paragraphMetadata[paragraphFormats.length] || {};
      const styleName = String(paragraph.styleName || paragraph.styleId || metadata.styleId || '').trim();
      const toc = TOC_STYLE.test(styleName);
      const rawAlignment = paragraph.alignment || metadata.alignment;
      const alignment = { both: 'justify', distribute: 'justify', start: 'left', end: 'right' }[rawAlignment] || rawAlignment;
      const indent = paragraph.indent || {};
      const toCm = twips => Math.round((Number(twips) || 0) / 567 * 100) / 100;
      const styles = [];
      if (['left', 'center', 'right', 'justify'].includes(alignment)) styles.push(`text-align:${alignment}`);
      const left = toCm(indent.start);
      const right = toCm(indent.end);
      const firstLine = toCm(indent.firstLine) || -toCm(indent.hanging);
      const paragraphLeft = toCm(metadata.leftIndent);
      const paragraphRight = toCm(metadata.rightIndent);
      const paragraphFirstLine = metadata.hangingIndent ? -toCm(metadata.hangingIndent) : toCm(metadata.firstLineIndent);
      const finalLeft = left || paragraphLeft;
      const finalRight = right || paragraphRight;
      const finalFirstLine = firstLine || paragraphFirstLine;
      if (finalLeft) styles.push(`margin-left:${finalLeft}cm`);
      if (finalRight) styles.push(`margin-right:${finalRight}cm`);
      if (finalFirstLine) styles.push(`text-indent:${finalFirstLine}cm`);
      const definition = metadata.styleId ? styleDefinitions.get(metadata.styleId) : null;
      const headingLevel = toc || metadata.styleId === 'Bibliography' ? null : (definition?.headingLevel || (metadata.outlineLevel !== null && metadata.outlineLevel >= 0 ? metadata.outlineLevel + 1 : null));
      if (headingLevel === 1 && /^BAB\s+[IVXLCDM]+\b/i.test(metadata.plainText || '')) {
        const roman = /^BAB\s+([IVXLCDM]+)/i.exec(metadata.plainText)[1].toUpperCase();
        const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
        const chapter = [...roman].reduce((sum, char, i) => sum + (values[char] < (values[roman[i + 1]] || 0) ? -values[char] : values[char]), 0);
        for (const [numId, levels] of numbering) if (levels.get(1)?.lvlText?.includes('%1')) headingCounters.set(numId, [chapter]);
      }
      const numberMarker = metadata.hasNumbering ? headingNumber(metadata, numbering, headingCounters) : null;
      paragraphFormats.push({ style: styles.join(';'), styleId: metadata.styleId || null, toc, headingLevel, numberMarker, hasImage: metadata.hasImage, imageSize: getImageSize(metadata.xml), pageBreakBefore: false, pageBreakCount: 0, spaceBefore: 0, spaceAfter: 0, lineSpacing: null });
      return {
        ...paragraph,
        numbering: numberMarker ? null : paragraph.numbering,
        styleName: toc ? 'RapiMakalah TOC' : paragraph.styleName,
      };
    }),
    styleMap: [
      "p[style-name='RapiMakalah TOC'] => p.toc-entry:fresh",
      "p[style-name='TOC Heading'] => h2:fresh",
      "p[style-name='Daftar Isi'] => h2:fresh",
    ],
    convertImage: mammoth.images.imgElement(async image => {
      if (!['image/png', 'image/jpeg'].includes(image.contentType)) return { src: '' };
      const data = await image.read('base64');
      return { src: data.length < 950000 ? `data:${image.contentType};base64,${data}` : '' };
    }),
  });

  const htmlParagraphFormats = paragraphFormats.map((format, index) => {
    const parsed = paragraphMetadata[index] || {};
    format.pageBreakBefore = parsed.pageBreakBefore && !/<w:pageBreakBefore\b[^>]*w:val=["'](?:0|false|off)["']/.test(parsed.xml);
    format.pageBreakCount = 0;
    format.sectionBreak = parsed.sectionBreak;
    const frame = parsed.xml?.match(/<w:framePr\b[^>]*>/)?.[0] || '';
    format.bottomFrame = getAttr(frame, 'w:yAlign') === 'bottom' && getAttr(frame, 'w:vAnchor') === 'margin';
    format.tocBold = /<w:b\b(?![^>]*w:val=["'](?:0|false|off)["'])/.test(parsed.xml || '');
    format.spaceBefore = parsed.spaceBefore;
    format.spaceAfter = parsed.spaceAfter;
    format.lineSpacing = parsed.lineSpacing && parsed.lineRule === 'auto'
      ? Math.round(parsed.lineSpacing / 240 * 100) / 100
      : null;
    format.text = normalizeText(parsed.plainText || '');
    format.hasImage = parsed.hasImage;
    return format;
  });
  const warnings = result.messages.map(message => message.message);
  if (/<w:instrText\b[^>]*>\s*TOC\s|w:val="TOC\d*"/i.test(documentXml)) warnings.push('Daftar isi Word dibuka sebagai teks statis yang bisa diedit; pembaruan nomor halaman otomatis tetap tersedia di Word, bukan di editor ini.');

  const html = sanitizeHtml(result.value, {
    allowedTags: ['p', 'br', 'h1', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 's', 'span', 'ul', 'ol', 'li', 'table', 'tbody', 'thead', 'tr', 'td', 'th', 'img', 'blockquote', 'hr', 'div'],
    allowedAttributes: { p: ['class', 'style', 'data-space-before', 'data-space-after', 'data-line-spacing'], h1: ['class', 'style', 'data-space-before', 'data-space-after', 'data-line-spacing'], h2: ['class', 'style', 'data-space-before', 'data-space-after', 'data-line-spacing'], h3: ['class', 'style', 'data-space-before', 'data-space-after', 'data-line-spacing'], img: ['src', 'alt', 'width', 'height'], td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan'], ol: ['start'], div: ['data-page-break-before'], span: ['data-writing-tab'] },
    allowedClasses: { p: ['toc-entry', 'import-heading', 'import-cover-image'], h1: ['toc-entry', 'import-heading'], h2: ['toc-entry', 'import-heading'], h3: ['toc-entry', 'import-heading'], span: ['toc-title', 'toc-page-number', 'toc-leader', 'writing-tab'] },
    allowedSchemes: ['data'],
    allowedSchemesAppliedToAttributes: ['src'],
    allowProtocolRelative: false,
  });

  const firstSection = sections[0] || null;
  const layoutKey = section => JSON.stringify({ width: section.width, height: section.height, orientation: section.orientation, margins: section.margins });
  const mixedSections = sections.some(section => layoutKey(section) !== layoutKey(firstSection));
  if (mixedSections) warnings.push('Dokumen memiliki beberapa section dengan tata halaman berbeda. Editor menerapkan ukuran dan margin section pertama ke seluruh draft; section berikutnya perlu diperiksa.');
  const remaining = htmlParagraphFormats.map((format, index) => ({ ...format, sourceIndex: index }));
  let searchFrom = 0;
  const formattedHtml = html.replace(/<(p|h1|h2|h3)\b([^>]*)>([\s\S]*?)<\/\1>/g, (block, tag, rawAttrs, inner) => {
    const marker = new RegExp(`${prefix}P(\\d+)Z`).exec(inner);
    if (marker) inner = inner.replace(marker[0], '');
    const text = normalizeText(stripHtml(inner));
    let index = marker ? remaining.findIndex(format => format.sourceIndex === Number(marker[1])) : remaining.findIndex((format, candidate) => candidate >= searchFrom && format.text === text);
    if (index < 0 && !text) index = remaining.findIndex((format, candidate) => candidate >= searchFrom && format.hasImage);
    if (index < 0) index = remaining.findIndex(format => format.text === text);
    if (index < 0) return block;
    const [format] = remaining.splice(index, 1);
    searchFrom = index;
    const attributes = parseAttributes(rawAttrs);
    if (format.bottomFrame) attributes['data-bottom-frame'] = 'true';
    let outputTag = tag;
    let outputInner = inner;
    const classes = new Set((attributes.class || '').split(/\s+/).filter(Boolean));
    if (format.toc) classes.add('toc-entry');
    if (format.headingLevel && !format.toc) classes.add('import-heading');
    if (format.hasImage && !text) classes.add('import-cover-image');
    if (classes.size) attributes.class = [...classes].join(' ');
    const inlineStyles = parseStylesAttribute(attributes.style || '');
    Object.assign(inlineStyles, parseStylesAttribute(format.style || ''));
    if (Object.keys(inlineStyles).length) attributes.style = Object.entries(inlineStyles).map(([key, value]) => `${key}:${value}`).join(';');
    if (format.spaceBefore != null) attributes['data-space-before'] = String(Math.round(format.spaceBefore / 20));
    if (format.spaceAfter != null) attributes['data-space-after'] = String(Math.round(format.spaceAfter / 20));
    if (format.lineSpacing) attributes['data-line-spacing'] = String(format.lineSpacing);
    if (format.toc) {
      const tocText = normalizeText(stripHtml(inner.replace(new RegExp(`${prefix}X\\d+Z`, 'g'), ' ')));
      const pageMatch = /\s+([ivxlcdm]+|\d+)$/i.exec(tocText);
      const label = pageMatch ? tocText.slice(0, pageMatch.index).trim() : tocText;
      const titleHtml = format.tocBold ? `<strong>${escapeHtml(label)}</strong>` : escapeHtml(label);
      const pageHtml = format.tocBold && pageMatch ? `<strong>${escapeHtml(pageMatch[1])}</strong>` : escapeHtml(pageMatch?.[1] || '');
      outputInner = `<span class="toc-title">${titleHtml}</span>${pageMatch ? '<span class="toc-leader" aria-hidden="true"></span>' + `<span class="toc-page-number">${pageHtml}</span>` : ''}`;
    }
    if (format.hasImage && format.imageSize) {
      outputInner = outputInner.replace(/<img\b([^>]*)>/, (image, imageAttrs) => {
        const width = Math.min(16, format.imageSize.width);
        const height = Math.min(18, format.imageSize.height);
        return `<img${imageAttrs} width="${Math.round(width * 37.795)}" height="${Math.round(height * 37.795)}">`;
      });
    }
    if (!format.toc && format.headingLevel) {
      outputTag = `h${Math.min(3, format.headingLevel)}`;
    }
    if (!format.toc && format.numberMarker && !text.startsWith(format.numberMarker)) outputInner = `<span data-number-label="${escapeAttribute(format.numberMarker)}" data-number-width="${Math.abs(parseFloat(inlineStyles['text-indent'])) || 1.25}">${escapeHtml(format.numberMarker)}</span>${outputInner}`;
    const attrs = Object.entries(attributes).map(([key, value]) => `${key}="${escapeAttribute(value)}"`);
    // Word's empty section carrier is a boundary, not an extra visible line.
    if (format.sectionBreak && !text && !format.hasImage) {
      return format.sectionBreak === 'continuous' ? '' : '<div data-page-break-before="1"></div>';
    }
    for (const [key, replacement] of tokens) outputInner = outputInner.replaceAll(key, replacement);
    const open = `<${outputTag}${attrs.length ? ` ${attrs.join(' ')}` : ''}>`;
    outputInner = outputInner.replace(/<div data-page-break-before="1"><\/div>/g, `</${outputTag}><div data-page-break-before="1"></div>${open}`);
    const output = `${open}${outputInner}</${outputTag}>${format.sectionBreak && format.sectionBreak !== 'continuous' ? '<div data-page-break-before="1"></div>' : ''}`;
    const breakCount = format.pageBreakCount + Number(format.pageBreakBefore);
    return breakCount ? `<div data-page-break-before="${Math.min(10, breakCount)}"></div>${output}` : output;
  });
  const rawWidth = firstSection?.width || null;
  const rawHeight = firstSection?.height || null;
  const landscape = firstSection?.orientation === 'landscape' || (rawWidth && rawHeight && rawWidth > rawHeight);
  const pageWidth = landscape ? Math.max(rawWidth, rawHeight) : Math.min(rawWidth, rawHeight);
  const pageHeight = landscape ? Math.min(rawWidth, rawHeight) : Math.max(rawWidth, rawHeight);
  const margins = firstSection?.margins ? Object.fromEntries(Object.entries(firstSection.margins).map(([key, value]) => [key, Number(value) / 1440 * 2.54])) : null;
  return { html: formattedHtml, warnings: [...new Set(warnings)], page: firstSection ? {
    width: pageWidth / 1440 * 2.54,
    height: pageHeight / 1440 * 2.54,
    orientation: firstSection.orientation,
    margins,
  } : null };
}

function normalizeText(value = '') {
  return String(value).replace(/[\f\n\t\u00a0]/g, ' ').replace(/\s+/g, ' ').trim();
}

function stripHtml(value = '') {
  return value.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function escapeAttribute(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escapeHtml(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseAttributes(value = '') {
  const attributes = {};
  for (const match of value.matchAll(/([\w-]+)="([^"]*)"/g)) attributes[match[1]] = match[2];
  return attributes;
}

function parseStylesAttribute(value = '') {
  return Object.fromEntries(String(value).split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const separator = part.indexOf(':');
    return separator > 0 ? [part.slice(0, separator).trim(), part.slice(separator + 1).trim()] : null;
  }).filter(Boolean));
}

function headingNumber(paragraph, numbering, counterMap) {
  const levels = numbering.get(paragraph.numId);
  const currentLevel = Number(paragraph.ilvl) || 0;
  const definition = levels?.get(currentLevel);
  if (!definition || !definition.lvlText) return null;
  const counters = counterMap.get(paragraph.numId) || [];
  counterMap.set(paragraph.numId, counters);
  counters[currentLevel] = (counters[currentLevel] ?? (definition.start || 1) - 1) + 1;
  counters.length = currentLevel + 1;
  return definition.lvlText.replace(/%(\d)/g, (_, number) => {
    const level = Number(number) - 1;
    const value = counters[level] || levels.get(level)?.start || 1;
    const fmt = levels.get(level)?.numFmt;
    if (fmt === 'lowerLetter' || fmt === 'upperLetter') return String.fromCharCode((fmt === 'lowerLetter' ? 97 : 65) + (value - 1) % 26);
    if (fmt === 'lowerRoman' || fmt === 'upperRoman') {
      let n = value, roman = '';
      for (const [v, s] of [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]) while (n >= v) { roman += s; n -= v; }
      return fmt === 'lowerRoman' ? roman.toLowerCase() : roman;
    }
    return String(value);
  });
}

function getImageSize(paragraphXml = '') {
  const extent = paragraphXml.match(/<wp:extent\b[^>]*>/)?.[0] || paragraphXml.match(/<a:ext\b[^>]*>/)?.[0] || '';
  if (!extent) return null;
  const width = Number(getAttr(extent, 'cx')) / 360000;
  const height = Number(getAttr(extent, 'cy')) / 360000;
  return width > 0 && height > 0 ? { width, height } : null;
}
