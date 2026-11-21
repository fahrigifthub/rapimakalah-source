/**
 * Small, dependency-free OOXML helpers.
 *
 * RapiMakalah edits the original OOXML package in place (via JSZip) instead of
 * converting to HTML and rebuilding the document. That keeps tables, images,
 * hyperlinks, footnotes and unknown parts intact.
 *
 * The helpers below are intentionally conservative: they only touch the
 * specific properties we need and leave everything else untouched.
 */

const TAG_RE = /<(\/)?([A-Za-z_][\w:.-]*)((?:\s+[A-Za-z_:][\w:.-]*\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/)?>/g;

const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
};

export function decodeXml(value = '') {
  return value
    .replace(/&(amp|lt|gt|quot|apos);/g, (m) => ENTITIES[m])
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

export function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function getAttr(tagXml = '', name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`\\b${escaped}\\s*=\\s*("([^"]*)"|'([^']*)')`).exec(tagXml);
  return match ? decodeXml(match[2] ?? match[3]) : null;
}

/** Scan direct children of a container (pass the *inner* XML). */
export function scanChildren(inner = '') {
  const children = [];
  const re = new RegExp(TAG_RE.source, 'g');
  let depth = 0;
  let current = null;
  let match;
  while ((match = re.exec(inner))) {
    const closing = Boolean(match[1]);
    const name = match[2];
    const selfClosing = Boolean(match[4]) && !closing;
    if (current) {
      depth += closing ? -1 : selfClosing ? 0 : 1;
      if (depth === 0) {
        children.push({ name: current.name, start: current.start, end: re.lastIndex, xml: inner.slice(current.start, re.lastIndex) });
        current = null;
      }
      continue;
    }
    if (closing) continue;
    if (selfClosing) {
      children.push({ name, start: match.index, end: re.lastIndex, xml: match[0] });
      continue;
    }
    current = { name, start: match.index };
    depth = 1;
  }
  return children;
}

/** Find the first element with the given tag and return its ranges. */
export function findElement(xml = '', tag, from = 0) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const openRe = new RegExp(`<${escaped}(?=\\s|>|/)`, 'g');
  openRe.lastIndex = from;
  const open = openRe.exec(xml);
  if (!open) return null;
  const tagEnd = xml.indexOf('>', open.index);
  if (tagEnd === -1) return null;
  const openTag = xml.slice(open.index, tagEnd + 1);
  if (openTag.endsWith('/>')) {
    return { start: open.index, openEnd: tagEnd + 1, closeStart: tagEnd + 1, end: tagEnd + 1, openTag, selfClosing: true };
  }
  const depthRe = new RegExp(`<(/)?${escaped}(?=\\s|>|/)[^>]*?(/)?>`, 'g');
  depthRe.lastIndex = tagEnd + 1;
  let depth = 1;
  let m;
  while ((m = depthRe.exec(xml))) {
    const isClose = Boolean(m[1]);
    const isSelf = Boolean(m[2]);
    if (isClose) depth -= 1;
    else if (!isSelf) depth += 1;
    if (depth === 0) {
      return {
        start: open.index,
        openEnd: tagEnd + 1,
        closeStart: m.index,
        end: depthRe.lastIndex,
        openTag,
        selfClosing: false,
      };
    }
  }
  return null;
}

export function getInner(xml, tag) {
  const range = findElement(xml, tag);
  if (!range) return null;
  if (range.selfClosing) return { inner: '', range };
  return { inner: xml.slice(range.openEnd, range.closeStart), range };
}

export function removeChild(inner, name) {
  const children = scanChildren(inner);
  let out = '';
  let cursor = 0;
  for (const child of children) {
    if (child.name === name) {
      out += inner.slice(cursor, child.start);
      cursor = child.end;
    }
  }
  return out + inner.slice(cursor);
}

export function upsertChild(inner, name, elementXml, order = []) {
  const cleaned = removeChild(inner, name);
  const targetOrder = order.indexOf(name);
  let insertAt = cleaned.length;
  if (targetOrder !== -1) {
    for (const child of scanChildren(cleaned)) {
      const childOrder = order.indexOf(child.name);
      if (childOrder !== -1 && childOrder > targetOrder) {
        insertAt = child.start;
        break;
      }
    }
  }
  return cleaned.slice(0, insertAt) + elementXml + cleaned.slice(insertAt);
}

export const PPR_ORDER = [
  'w:pStyle', 'w:keepNext', 'w:keepLines', 'w:pageBreakBefore', 'w:framePr', 'w:widowControl',
  'w:numPr', 'w:suppressLineNumbers', 'w:pBdr', 'w:shd', 'w:tabs', 'w:suppressAutoHyphens',
  'w:kinsoku', 'w:wordWrap', 'w:overflowPunct', 'w:topLinePunct', 'w:autoSpaceDE',
  'w:autoSpaceDN', 'w:bidi', 'w:adjustRightInd', 'w:snapToGrid', 'w:spacing', 'w:ind',
  'w:contextualSpacing', 'w:mirrorIndents', 'w:suppressOverlap', 'w:jc', 'w:textDirection',
  'w:textAlignment', 'w:textboxTightWrap', 'w:outlineLvl', 'w:divId', 'w:cnfStyle', 'w:rPr',
  'w:sectPr', 'w:pPrChange',
];

export const RPR_ORDER = [
  'w:rStyle', 'w:rFonts', 'w:b', 'w:bCs', 'w:i', 'w:iCs', 'w:caps', 'w:smallCaps', 'w:strike',
  'w:dstrike', 'w:outline', 'w:shadow', 'w:emboss', 'w:imprint', 'w:noProof', 'w:snapToGrid',
  'w:vanish', 'w:webHidden', 'w:color', 'w:spacing', 'w:w', 'w:kern', 'w:position', 'w:sz',
  'w:szCs', 'w:highlight', 'w:u', 'w:effect', 'w:bdr', 'w:shd', 'w:fitText', 'w:vertAlign',
  'w:rtl', 'w:cs', 'w:em', 'w:lang', 'w:eastAsianLayout', 'w:specVanish', 'w:oMath',
];

/** Set a property inside w:pPr of a paragraph. */
export function setParagraphProperty(paragraphXml, name, elementXml) {
  let xml = paragraphXml;
  const ppr = getInner(xml, 'w:pPr');
  if (ppr) {
    if (ppr.range.selfClosing) {
      return xml.slice(0, ppr.range.start) + `<w:pPr>${elementXml}</w:pPr>` + xml.slice(ppr.range.end);
    }
    const inner = upsertChild(ppr.inner, name, elementXml, PPR_ORDER);
    xml = xml.slice(0, ppr.range.openEnd) + inner + xml.slice(ppr.range.closeStart);
    return xml;
  }
  const openEnd = xml.indexOf('>') + 1;
  const pPr = `<w:pPr>${elementXml}</w:pPr>`;
  return xml.slice(0, openEnd) + pPr + xml.slice(openEnd);
}

/** Remove a property from w:pPr (if present). */
export function removeParagraphProperty(paragraphXml, name) {
  const ppr = getInner(paragraphXml, 'w:pPr');
  if (!ppr) return paragraphXml;
  const inner = removeChild(ppr.inner, name);
  return paragraphXml.slice(0, ppr.range.openEnd) + inner + paragraphXml.slice(ppr.range.closeStart);
}

/** Set a property on every w:r in a paragraph (or a supplied run). */
export function setRunProperty(runXml, name, elementXml) {
  const rpr = getInner(runXml, 'w:rPr');
  if (rpr) {
    if (rpr.range.selfClosing) {
      return runXml.slice(0, rpr.range.start) + `<w:rPr>${elementXml}</w:rPr>` + runXml.slice(rpr.range.end);
    }
    const inner = upsertChild(rpr.inner, name, elementXml, RPR_ORDER);
    return runXml.slice(0, rpr.range.openEnd) + inner + runXml.slice(rpr.range.closeStart);
  }
  const openEnd = runXml.indexOf('>') + 1;
  return runXml.slice(0, openEnd) + `<w:rPr>${elementXml}</w:rPr>` + runXml.slice(openEnd);
}

export function getParagraphProperty(paragraphXml, name) {
  const ppr = getInner(paragraphXml, 'w:pPr');
  if (!ppr || ppr.range.selfClosing) return null;
  const child = scanChildren(ppr.inner).find((c) => c.name === name);
  return child ? child.xml : null;
}

export function getRunProperty(runXml, name) {
  const rpr = getInner(runXml, 'w:rPr');
  if (!rpr || rpr.range.selfClosing) return null;
  const child = scanChildren(rpr.inner).find((c) => c.name === name);
  return child ? child.xml : null;
}

export function replaceInner(xml, tag, newInner) {
  const found = getInner(xml, tag);
  if (!found) return xml;
  return xml.slice(0, found.range.openEnd) + newInner + xml.slice(found.range.closeStart);
}

/** Create a paragraph XML node from plain text (used for TOC headings / breaks). */
export function textParagraph(text, { bold = false, alignment, breakBefore = false, size } = {}) {
  const props = [];
  if (breakBefore) props.push('<w:pageBreakBefore/>');
  if (alignment) props.push(`<w:jc w:val="${alignment}"/>`);
  const pPr = props.length ? `<w:pPr>${props.join('')}</w:pPr>` : '';
  const rProps = [];
  if (bold) rProps.push('<w:b/><w:bCs/>');
  if (size) rProps.push(`<w:sz w:val="${size * 2}"/><w:szCs w:val="${size * 2}"/>`);
  const rPr = rProps.length ? `<w:rPr>${rProps.join('')}</w:rPr>` : '';
  return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}
