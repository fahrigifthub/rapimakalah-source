import assert from 'node:assert/strict';
import { buildDocxFromText } from '../src/docx/fromText.js';
import { formatDocument } from '../src/docx/format.js';
import { createPreview } from '../src/docx/preview.js';
import { getBodyStructure, readDocxBuffer } from '../src/docx/reader.js';
import { DEFAULT_TEMPLATE_CONFIG } from '../src/templates/defaults.js';

const source = await buildDocxFromText(`## 2.8 Upaya Pelestarian Badak Jawa

Selain mempertimbangkan pemindahan, terdapat berbagai upaya yang perlu dilakukan untuk menjaga kelestarian badak Jawa.

1. Melindungi Habitat Alami
Pemerintah perlu memastikan bahwa kawasan Taman Nasional Ujung Kulon tetap terjaga dari kerusakan hutan, perambahan, dan aktivitas ilegal.

2. Meningkatkan Pengawasan
Penggunaan kamera jebak, patroli hutan, serta teknologi pemantauan lainnya dapat membantu mengetahui kondisi populasi dan mendeteksi ancaman terhadap badak Jawa.

## 2.9 Analisis

1. Item bernomor di bagian lain tetap menjorok.
`);

const options = {
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
  cover: false,
  preface: false,
};
const result = await formatDocument(source, {
  config: structuredClone(DEFAULT_TEMPLATE_CONFIG),
  options,
  meta: {},
});
const zip = await readDocxBuffer(result.buffer);
const documentXml = await zip.file('word/document.xml').async('string');
const items = getBodyStructure(documentXml).blocks
  .filter((block) => block.data?.hasNumbering && /Melindungi Habitat|Meningkatkan Pengawasan|Item bernomor/.test(block.data.plainText));
assert.equal(items.length, 3, 'semua item bernomor terpilih, termasuk bagian lain');
for (const item of items) {
  assert.equal(item.data.leftIndent, 1159, 'nomor sejajar pada indentasi subheading');
  assert.equal(item.data.hangingIndent, 450, 'jarak marker ke teks dipersempit');
}
const continuations = getBodyStructure(documentXml).blocks
  .filter((block) => /Pemerintah perlu memastikan|Penggunaan kamera jebak/.test(block.data?.plainText || ''));
assert.equal(continuations.length, 2, 'teks isi sesudah item terdeteksi');
for (const block of continuations) {
  assert.equal(block.data.leftIndent, 1159, 'kalimat isi sejajar tepat di bawah judul item');
  assert.equal(block.data.firstLineIndent, 0, 'baris pertama dan baris lanjutan sama-sama di bawah judul item');
}

const preview = await createPreview(result.buffer, structuredClone(DEFAULT_TEMPLATE_CONFIG), 'processed', options);
const previewItems = preview.pages.flatMap((page) => page.blocks)
  .filter((block) => /Melindungi Habitat|Meningkatkan Pengawasan|Item bernomor/.test(block.text || ''));
assert.equal(previewItems.length, 3, 'preview memuat seluruh item bernomor');
for (const item of previewItems) {
  assert.ok(item.leftIndent > 0, 'teks item punya indentasi setelah posisi nomor');
  assert.ok(item.hangingIndent, 'preview menyediakan area hanging untuk posisi nomor');
  assert.ok(item.numberMarker, 'nomor tetap ditampilkan terpisah di area hanging');
}

// Imported/older DOCX often store list labels as literal text instead of
// w:numPr. Simulate that representation and verify the following prose indents.
const legacyZip = await readDocxBuffer(source);
let legacyXml = await legacyZip.file('word/document.xml').async('string');
const legacyStructure = getBodyStructure(legacyXml);
const legacyItems = legacyStructure.blocks.filter((block) =>
  block.data?.hasNumbering && /Melindungi Habitat|Meningkatkan Pengawasan|Item bernomor/.test(block.data.plainText),
);
let body = legacyStructure.bodyInner;
for (const [index, item] of [...legacyItems].reverse().entries()) {
  const marker = `${index + 1}. `;
  let paragraph = item.xml.replace(/<w:numPr\b[\s\S]*?<\/w:numPr>/, '');
  const insertionPoint = paragraph.indexOf('</w:pPr>');
  if (insertionPoint >= 0) {
    const at = insertionPoint + '</w:pPr>'.length;
    paragraph = paragraph.slice(0, at) + `<w:r><w:t>${marker}</w:t></w:r>` + paragraph.slice(at);
  } else {
    paragraph = paragraph.replace('<w:p>', `<w:p><w:r><w:t>${marker}</w:t></w:r>`);
  }
  body = body.slice(0, item.start) + paragraph + body.slice(item.end);
}
legacyXml = legacyXml.slice(0, legacyStructure.bodyRange.openEnd) + body + legacyXml.slice(legacyStructure.bodyRange.closeStart);
legacyZip.file('word/document.xml', legacyXml);
const legacySource = await legacyZip.generateAsync({ type: 'nodebuffer' });
const legacyResult = await formatDocument(legacySource, {
  config: structuredClone(DEFAULT_TEMPLATE_CONFIG),
  options,
  meta: {},
});
const legacyOut = await readDocxBuffer(legacyResult.buffer);
const legacyOutXml = await legacyOut.file('word/document.xml').async('string');
const legacyBlocks = getBodyStructure(legacyOutXml).blocks;
const legacyNumberedItems = legacyBlocks.filter((block) =>
  block.data?.hasNumbering && /Melindungi Habitat|Meningkatkan Pengawasan|Item bernomor/.test(block.data.plainText),
);
assert.equal(legacyNumberedItems.length, 3, 'label angka literal dikonversi jadi numbering OOXML');
for (const item of legacyNumberedItems) {
  assert.doesNotMatch(item.data.plainText, /^\s*\d+[.)]/, 'angka tidak tersisa sebagai teks biasa');
  assert.equal(item.data.leftIndent, 1159, 'item hasil konversi memakai jarak marker yang rapat');
  assert.equal(item.data.hangingIndent, 450, 'item hasil konversi tetap pakai hanging indent');
}
const legacyNumberingXml = await legacyOut.file('word/numbering.xml').async('string');
assert.match(legacyNumberingXml, /<w:lvlText w:val="%1\."\/>/, 'definisi numbering Word memuat marker angka desimal');
const legacyContinuations = legacyBlocks.filter((block) =>
  /Pemerintah perlu memastikan|Penggunaan kamera jebak/.test(block.data?.plainText || ''),
);
assert.equal(legacyContinuations.length, 2, 'teks lanjutan dokumen lama dikenali');
for (const block of legacyContinuations) {
  assert.equal(block.data.leftIndent, 1159, 'teks isi dokumen lama sejajar di bawah judul item');
  assert.equal(block.data.firstLineIndent, 0, 'baris isi dokumen lama tetap rata dengan baris lanjutannya');
}

console.log('PASS: numbered lists dan teks lanjutannya mendapat indentasi konsisten, termasuk list literal di DOCX lama.');
