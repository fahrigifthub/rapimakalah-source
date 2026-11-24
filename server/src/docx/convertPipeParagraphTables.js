import { readTextTable, textTableXml } from './textTables.js';
import { escapeXml } from './xml.js';
import { getBodyStructure } from './reader.js';

function simpleInlineRuns(value, base = '') {
  const text = String(value || '');
  const runs = [];
  const pattern = /\*\*(.+?)\*\*|\*([^*]+)\*/g;
  let cursor = 0;
  let match;
  const push = (part, props = base) => {
    if (!part) return;
    runs.push(`<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ''}<w:t xml:space="preserve">${escapeXml(part)}</w:t></w:r>`);
  };
  while ((match = pattern.exec(text))) {
    push(text.slice(cursor, match.index));
    push(match[1] ?? match[2], `${base}${match[1] !== undefined ? '<w:b/><w:bCs/>' : '<w:i/><w:iCs/>'}`);
    cursor = match.index + match[0].length;
  }
  push(text.slice(cursor));
  return runs.join('');
}

/** Rebuild previously-pasted Markdown pipe rows which were stored as paragraphs. */
export function convertPipeParagraphTables(documentXml) {
  const structure = getBodyStructure(documentXml);
  const blocks = structure.blocks;
  const edits = [];

  for (let i = 0; i < blocks.length; i += 1) {
    const header = blocks[i];
    const headerText = header.data?.plainText?.trim() || '';
    if (header.type !== 'w:p' || !headerText.includes('|')) continue;

    // Older uploaded DOCX files commonly put an empty paragraph between every
    // Markdown row. Treat those as separators while recovering the table.
    const nextNonEmptyParagraph = (from) => {
      let index = from;
      while (index < blocks.length && blocks[index].type === 'w:p' && !blocks[index].data?.plainText.trim()) index += 1;
      return index;
    };
    const delimiterIndex = nextNonEmptyParagraph(i + 1);
    if (delimiterIndex >= blocks.length || blocks[delimiterIndex].type !== 'w:p') continue;
    const delimiterText = blocks[delimiterIndex].data?.plainText?.trim() || '';
    if (!delimiterText.includes('|')) continue;

    const rowBlocks = [];
    let endIndex = delimiterIndex;
    let cursor = delimiterIndex + 1;
    while (cursor < blocks.length && rowBlocks.length < 500) {
      const rowIndex = nextNonEmptyParagraph(cursor);
      if (rowIndex >= blocks.length) break;
      const candidate = blocks[rowIndex];
      if (candidate.type !== 'w:p') break;
      const value = candidate.data?.plainText?.trim() || '';
      if (!value.includes('|')) break;
      rowBlocks.push(candidate);
      endIndex = rowIndex;
      cursor = rowIndex + 1;
    }
    if (!rowBlocks.length) continue;

    const allLines = [headerText, delimiterText, ...rowBlocks.map((block) => block.data.plainText.trim())];
    const parsed = readTextTable(allLines, 0);
    if (!parsed || parsed.next !== allLines.length) continue;
    edits.push({ first: header, last: blocks[endIndex], xml: textTableXml(parsed.table, { inlineRuns: simpleInlineRuns }) });
    i = endIndex;
  }

  if (!edits.length) return { documentXml, count: 0 };
  let inner = structure.bodyInner;
  for (const { first, last, xml } of edits.sort((a, b) => b.first.start - a.first.start)) {
    inner = inner.slice(0, first.start) + xml + inner.slice(last.end);
  }
  return {
    documentXml: documentXml.slice(0, structure.bodyRange.openEnd) + inner + documentXml.slice(structure.bodyRange.closeStart),
    count: edits.length,
  };
}
