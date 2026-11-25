import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import { formatDocument } from '../src/docx/format.js';
import { createPreview } from '../src/docx/preview.js';
import { getBodyStructure, readDocxBuffer } from '../src/docx/reader.js';
import { DEFAULT_TEMPLATE_CONFIG } from '../src/templates/defaults.js';

const input = await fs.readFile(new URL('../test-fixture.docx', import.meta.url));
const fixtureZip = await readDocxBuffer(input);
const originalXml = await fixtureZip.file('word/document.xml').async('string');
const originalStructure = getBodyStructure(originalXml);
const originalTable = originalStructure.blocks.find(block => block.type === 'w:tbl');
assert.ok(originalTable, 'Regression fixture has a table');

// Add two distinct cell alignments so the regression checks that moving the
// table object to center does not also rewrite paragraph text alignment.
let paragraphIndex = 0;
const alignedTable = originalTable.xml.replace(/<w:p\b[^>]*>/g, openTag => {
  if (paragraphIndex > 1) return openTag;
  const align = paragraphIndex++ === 0 ? 'left' : 'center';
  return openTag.replace(/>$/, `><w:pPr><w:jc w:val="${align}"/></w:pPr>`);
});
assert.equal(paragraphIndex, 2, 'Regression fixture has at least two table-cell paragraphs');
const inputXml = originalXml.slice(0, originalStructure.bodyRange.openEnd + originalTable.start) +
  alignedTable +
  originalXml.slice(originalStructure.bodyRange.openEnd + originalTable.end);
fixtureZip.file('word/document.xml', inputXml);
const regressionInput = await fixtureZip.generateAsync({ type: 'nodebuffer' });
const sourceStructure = getBodyStructure(inputXml);
const sourceImages = sourceStructure.blocks.filter(block => block.type === 'w:p' && block.data?.hasImage);
const sourceTables = sourceStructure.blocks.filter(block => block.type === 'w:tbl');
assert.ok(sourceImages.length > 0, 'Regression fixture has an embedded image');

const config = structuredClone(DEFAULT_TEMPLATE_CONFIG);
const options = {
  cover: true,
  margins: true,
  font: true,
  fontSize: true,
  lineSpacing: true,
  firstLineIndent: true,
  alignment: true,
  headings: true,
  paragraphSpacing: true,
  pageNumbering: false,
  toc: false,
};
const { buffer } = await formatDocument(regressionInput, { config, options, includeToc: false });
const outputZip = await readDocxBuffer(buffer);
const outputXml = await outputZip.file('word/document.xml').async('string');
const xmlErrors = [];
new DOMParser({
  errorHandler: {
    warning: message => xmlErrors.push(message),
    error: message => xmlErrors.push(message),
    fatalError: message => xmlErrors.push(message),
  },
}).parseFromString(outputXml, 'application/xml');
assert.deepEqual(xmlErrors, [], `Formatted document.xml is well-formed XML: ${xmlErrors.join('; ')}`);
const outputStructure = getBodyStructure(outputXml);
const outputImages = outputStructure.blocks.filter(block => block.type === 'w:p' && block.data?.hasImage);
const outputTables = outputStructure.blocks.filter(block => block.type === 'w:tbl');

assert.ok(outputImages.length >= sourceImages.length, 'Source images are preserved through formatting (generated cover media may add images)');
for (const image of outputImages) {
  assert.match(image.xml, /<w:jc w:val="center"\/>/, 'Image paragraph is explicitly centered');
  assert.doesNotMatch(image.xml, /<w:ind\b[^>]*w:firstLine="\d+"/, 'Image paragraph has no first-line indent');
}
assert.ok(outputTables.length >= sourceTables.length, 'Source tables are preserved through formatting (generated cover tables may add tables)');
const getCellAlignments = xml => [...xml.matchAll(/<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/g)].flatMap(([, cell]) =>
  [...cell.matchAll(/<w:pPr\b[^>]*>([\s\S]*?)<\/w:pPr>/g)].map(([, pPr]) =>
    /<w:jc\b[^>]*w:val="([^"]+)"/.exec(pPr)?.[1] || null,
  ),
);
for (const [index, table] of outputTables.entries()) {
  const tblPr = table.xml.match(/<w:tblPr\b[^>]*>([\s\S]*?)<\/w:tblPr>/)?.[1] || '';
  assert.match(tblPr, /<w:jc w:val="center"\/>/, `Table ${index + 1} is explicitly centered`);
}
for (const sourceTable of sourceTables) {
  const sourceText = sourceTable.data.text.replace(/\s+/g, ' ').trim();
  const preserved = outputTables.find(table => table.data.text.replace(/\s+/g, ' ').trim() === sourceText);
  assert.ok(preserved, 'Every source table remains in the formatted output');
  assert.deepEqual(
    getCellAlignments(preserved.xml),
    getCellAlignments(sourceTable.xml),
    'Table retains source text alignment inside cells',
  );
}

const preview = await createPreview(buffer, config, 'processed', options);
const previewBlocks = preview.pages.flatMap(page => page.blocks);
const previewImages = previewBlocks.filter(block => block.images?.length);
assert.ok(previewImages.length > 0, 'Image remains available in the formatted preview');
assert.ok(previewImages.every(block => block.alignment === 'center'), 'Every preview image block is centered');
const previewTable = previewBlocks.find(block => block.type === 'table');
assert.ok(previewTable, 'Table remains available in the formatted preview');
assert.equal(previewTable.tableAlign, 'center', 'Preview exposes centered table-object alignment');
assert.deepEqual(
  previewTable.rows.flatMap(row => row.map(cell => cell.align)).filter(Boolean).slice(0, 2),
  ['left', 'center'],
  'Preview retains the distinct paragraph alignments within table cells',
);
console.log(`PASS: ${outputImages.length} image paragraph(s) centered; ${outputTables.length} table(s) centered; cell text alignment preserved; preview retains both.`);
