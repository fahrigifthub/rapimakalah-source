import { getBodyStructure } from './reader.js';
import { setParagraphProperty } from './xml.js';

const MARKER = /^\s*(\d{1,3})[.)]\s+/;
const SECTION_LABEL = /^(?:PENDAHULUAN|PENUTUP|KESIMPULAN|SARAN|RUMUSAN\s+MASALAH|TUJUAN(?:\s+DAN\s+MANFAAT)?|DAFTAR\s+(?:ISI|PUSTAKA|TABEL|GAMBAR)|ABSTRAK)$/i;
const LIST_TEXT_START = 709 + 450;

function nextId(xml, tag, attribute) {
  let max = -1;
  for (const match of xml.matchAll(new RegExp(`<w:${tag}\\b[^>]*w:${attribute}="(\\d+)"`, 'g'))) {
    max = Math.max(max, Number(match[1]));
  }
  return max + 1;
}

function appendListNumbering(numberingXml, abstractId, numId, start) {
  let xml = numberingXml || `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"></w:numbering>`;
  const abstractNum = `<w:abstractNum w:abstractNumId="${abstractId}"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="${start}"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="${LIST_TEXT_START}"/></w:tabs><w:ind w:left="${LIST_TEXT_START}" w:hanging="450"/></w:pPr></w:lvl></w:abstractNum>`;
  const num = `<w:num w:numId="${numId}"><w:abstractNumId w:val="${abstractId}"/></w:num>`;
  const closing = xml.lastIndexOf('</w:numbering>');
  if (closing < 0) return xml;
  const firstNum = xml.indexOf('<w:num ');
  const abstractInsert = firstNum >= 0 && firstNum < closing ? firstNum : closing;
  const withAbstract = `${xml.slice(0, abstractInsert)}${abstractNum}${xml.slice(abstractInsert)}`;
  const finalClosing = withAbstract.lastIndexOf('</w:numbering>');
  return `${withAbstract.slice(0, finalClosing)}${num}${withAbstract.slice(finalClosing)}`;
}

function removeTypedMarker(paragraphXml) {
  const textNodes = [...paragraphXml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)];
  const combined = textNodes.map((match) => match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')).join('');
  const marker = MARKER.exec(combined);
  if (!marker) return paragraphXml;

  let remaining = marker[0].length;
  let out = paragraphXml;
  for (const node of textNodes) {
    if (remaining <= 0) break;
    const raw = node[1];
    const plain = raw.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const removeCount = Math.min(remaining, plain.length);
    out = out.replace(node[0], node[0].replace(raw, raw.slice(removeCount)));
    remaining -= removeCount;
  }
  return out;
}

/**
 * Convert manually typed numbered paragraphs into real Word numbering. It
 * preserves the existing prose while moving the visible marker into w:numPr.
 */
export function convertTypedNumberedLists(documentXml, numberingXml = '') {
  const structure = getBodyStructure(documentXml);
  const blocks = structure.blocks;
  const groups = [];
  let current = [];
  let inBibliography = false;

  const flush = () => {
    if (current.length) groups.push(current);
    current = [];
  };

  for (const block of blocks) {
    const value = block.data?.plainText || '';
    if (block.type === 'w:p' && /^(daftar\s+pustaka|referensi|references|bibliography)$/i.test(value.trim())) {
      flush();
      inBibliography = true;
      continue;
    }
    if (inBibliography && block.type === 'w:p' && /^(?:BAB\s+[IVXL\d]+\b|\d+(?:\.\d+)+\.?\s+\S)/i.test(value.trim())) {
      inBibliography = false;
    }
    const isTypedItem = block.type === 'w:p' && block.data && !block.data.hasNumbering && MARKER.test(value);
    const itemMarker = isTypedItem ? MARKER.exec(value) : null;
    const itemText = itemMarker ? value.slice(itemMarker[0].length).trim() : '';
    const isSectionHeading = SECTION_LABEL.test(itemText) || (/^[A-Z0-9\s:,&()'-]+$/.test(itemText) && itemText.length < 100);
    if (isTypedItem && !inBibliography && !isSectionHeading) {
      current.push({ block, start: Number(itemMarker[1]) });
      continue;
    }
    // Empty paragraphs between list items are common in uploaded Word files;
    // retain the same list instance across them, but terminate at real prose.
    if (current.length && block.type === 'w:p' && !value.trim()) continue;
    flush();
  }
  flush();
  if (!groups.length) return { documentXml, numberingXml, count: 0 };

  let nextAbstractId = nextId(numberingXml, 'abstractNum', 'abstractNumId');
  let nextNumId = nextId(numberingXml, 'num', 'numId');
  let updatedNumbering = numberingXml;
  const edits = [];
  for (const group of groups) {
    const abstractId = nextAbstractId++;
    const numId = nextNumId++;
    updatedNumbering = appendListNumbering(updatedNumbering, abstractId, numId, group[0].start);
    for (const { block } of group) {
      let paragraph = removeTypedMarker(block.xml);
      paragraph = setParagraphProperty(paragraph, 'w:numPr', `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${numId}"/></w:numPr>`);
      paragraph = setParagraphProperty(paragraph, 'w:ind', `<w:ind w:left="${LIST_TEXT_START}" w:right="0" w:hanging="450"/>`);
      edits.push({ block, paragraph });
    }
  }

  let body = structure.bodyInner;
  for (const { block, paragraph } of edits.sort((a, b) => b.block.start - a.block.start)) {
    body = body.slice(0, block.start) + paragraph + body.slice(block.end);
  }
  const updatedDocument = documentXml.slice(0, structure.bodyRange.openEnd) + body + documentXml.slice(structure.bodyRange.closeStart);
  return { documentXml: updatedDocument, numberingXml: updatedNumbering, count: edits.length };
}
