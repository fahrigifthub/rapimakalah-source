import assert from 'node:assert/strict';
import { buildDocxFromText } from '../src/docx/fromText.js';
import { formatDocument } from '../src/docx/format.js';
import { readDocxBuffer } from '../src/docx/reader.js';
import { DEFAULT_TEMPLATE_CONFIG } from '../src/templates/defaults.js';

const sourceText = `# TABEL UJI FORMAT MAKALAH

## KATA PENGANTAR

Kata pengantar untuk memastikan frontmatter tetap berfungsi.

## BAB I
## PENDAHULUAN

### 1.1 Latar Belakang

Paragraf badan makalah untuk memastikan isi tetap mengikuti template.

Berikut tabel uji:

| No. | Aspek | Keterangan |
|---|---|---|
| 1 | Nama ilmiah | *Rhinoceros sondaicus* |
| 2 | Status | Kritis |
`;

const config = structuredClone(DEFAULT_TEMPLATE_CONFIG);
const options = {
  cover: true,
  font: true,
  fontSize: true,
  alignment: true,
  firstLineIndent: true,
  margins: true,
  headings: true,
  lineSpacing: true,
  paragraphSpacing: true,
  preface: true,
  pageNumbering: false,
  toc: false,
};
const source = await buildDocxFromText(sourceText);
const result = await formatDocument(source, {
  config,
  options,
  meta: { title: 'Tabel Uji Format Makalah', institution: 'Universitas', department: '' },
});
const zip = await readDocxBuffer(result.buffer);
const xml = await zip.file('word/document.xml').async('string');
const markedTables = [...xml.matchAll(/<w:tbl\b[\s\S]*?<\/w:tbl>/g)]
  .map((match) => match[0])
  .filter((table) => /RapiMakalah Text Table/.test(table));
assert.equal(markedTables.length, 1, 'satu tabel teks tetap satu tabel selepas format');
const paragraphs = [...markedTables[0].matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)].map((match) => match[0]);
for (const paragraph of paragraphs) {
  assert.match(paragraph, /w:line="360"/, 'spasi baris isi tabel mengikuti template makalah 1,5');
  assert.match(paragraph, /w:before="0"/, 'tidak ada spasi tambahan sebelum paragraf sel');
  assert.match(paragraph, /w:after="0"/, 'tidak ada spasi tambahan setelah paragraf sel');
}
assert.match(markedTables[0], /<w:rFonts[^>]*w:ascii="Times New Roman"/, 'font tabel disamakan dengan template');
assert.match(markedTables[0], /<w:sz w:val="24"\/>/, 'ukuran font tabel mengikuti 12 pt');
assert.match(markedTables[0], /<w:insideH w:val="single"/, 'border tabel tetap terlihat');
assert.ok(result.report.appliedRules.some((item) => item.includes('Spasi tabel teks diselaraskan')),
  'laporan mencatat tabel teks ikut diselaraskan');

console.log('PASS: Tabel hasil tempel mengikuti template makalah tanpa mengubah tabel lain.');
