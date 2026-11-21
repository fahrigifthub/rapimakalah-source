import { detectHeadings, getBodyStructure, parseStyles, readDocxBuffer } from './reader.js';
import { setParagraphProperty } from './xml.js';

// Align prose with the text column of its nearest subheading. Heading indents
// are absolute positions, so deeper levels never accumulate repeatedly.
export async function indentBody(buffer, { options = {}, config }) {
  if (!options.firstLineIndent) return { buffer, count: 0 };
  const zip = await readDocxBuffer(buffer);
  const xml = await zip.file('word/document.xml').async('string');
  const structure = getBodyStructure(xml);
  const headings = new Map(detectHeadings(structure.blocks, parseStyles(await zip.file('word/styles.xml')?.async('string') || '')).map(h => [h.blockIndex, h]));
  let active = false;
  let left = 0;
  let labelLeft = null;
  const edits = [];
  const first = Math.round(config.typography.firstLineIndent / 2.54 * 1440);
  for (const block of structure.blocks) {
    if (block.type !== 'w:p') continue;
    const p = block.data;
    const heading = headings.get(block.index);
    if (heading) {
      if (heading.level === 1) active = /^BAB\s/i.test(p.plainText);
      left = heading.level > 1 ? p.leftIndent || first : 0;
      labelLeft = null;
      continue;
    }
    if (/^(daftar\s+pustaka|referensi|references|bibliography|lampiran)$/i.test(p.plainText)) active = false;
    if (!active || !p.plainText || p.hasImage || /^(TOC|Bibliography)/i.test(p.styleId || '') || /<m:oMath|<w:framePr/.test(block.xml)) continue;
    let replacement;
    const label = !p.hasNumbering && /^(?:\d+|[A-Z])[.)]\s+/.test(p.plainText) && p.plainText.length < 110 && /<w:keepNext\/>/.test(block.xml);
    if (label) {
      labelLeft = left + 425;
      replacement = setParagraphProperty(block.xml, 'w:ind', `<w:ind w:left="${labelLeft}" w:right="0" w:hanging="425"/>`);
      replacement = setParagraphProperty(replacement, 'w:tabs', `<w:tabs><w:tab w:val="left" w:pos="${labelLeft}"/></w:tabs>`);
    } else if (p.hasNumbering) {
      const hanging = p.hangingIndent || 425;
      replacement = setParagraphProperty(block.xml, 'w:ind', `<w:ind w:left="${(labelLeft ?? left) + hanging + p.ilvl * 425}" w:right="0" w:hanging="${hanging}"/>`);
    } else if (!p.hangingIndent && (!p.styleId || /^(Normal|BodyText)$/i.test(p.styleId)) && !/<w:tabs/.test(block.xml)) {
      replacement = setParagraphProperty(block.xml, 'w:ind', `<w:ind w:left="${labelLeft ?? left}" w:right="0" w:firstLine="${first}"/>`);
    }
    if (replacement && replacement !== block.xml) edits.push({ block, replacement });
  }
  if (!edits.length) return { buffer, count: 0 };
  let inner = structure.bodyInner;
  for (const { block, replacement } of edits.slice().reverse()) inner = inner.slice(0, block.start) + replacement + inner.slice(block.end);
  zip.file('word/document.xml', xml.slice(0, structure.bodyRange.openEnd) + inner + xml.slice(structure.bodyRange.closeStart));
  return { buffer: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }), count: edits.length };
}
