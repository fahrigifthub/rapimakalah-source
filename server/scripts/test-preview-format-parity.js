import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { buildDocxFromText } from '../src/docx/fromText.js';
import { formatDocument } from '../src/docx/format.js';
import { createPreview } from '../src/docx/preview.js';
import { DEFAULT_TEMPLATE_CONFIG } from '../src/templates/defaults.js';

const config = structuredClone(DEFAULT_TEMPLATE_CONFIG);
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
const text = [
  'BAB I PENDAHULUAN',
  '1.1 Latar Belakang',
  'Paragraf pertama berisi isi makalah untuk menguji konsistensi format pada dokumen yang berasal dari upload Word dan dokumen yang dibentuk dari input teks.',
  'Paragraf kedua memuat rumus inline $n_1 > n_2$ dan juga teks yang cukup panjang agar preview melakukan estimasi baris dan halaman secara konsisten.',
  'BAB II PEMBAHASAN',
  '2.1 Pengertian',
  ...Array.from({ length: 28 }, (_, i) => `Paragraf ${i + 1} berisi kalimat panjang untuk memastikan perpindahan halaman dan pagination menggunakan geometri serta aturan format yang sama.`),
].join('\n\n');

const sourceTextDocx = await buildDocxFromText(text);
const uploadZip = await JSZip.loadAsync(sourceTextDocx);
let documentXml = await uploadZip.file('word/document.xml').async('string');
// Simulate a Word-authored uploaded DOCX with unrelated source geometry and
// explicit paragraph formatting; formatting with selected rules must converge.
documentXml = documentXml
  .replace('w:top="1701" w:right="1701" w:bottom="1701" w:left="2268"', 'w:top="900" w:right="900" w:bottom="900" w:left="900"')
  .replace(/<w:p>(?!<w:pPr>)([\s\S]*?)<\/w:p>/g, '<w:p><w:pPr><w:jc w:val="left"/><w:spacing w:line="480" w:lineRule="auto"/><w:ind w:firstLine="600"/></w:pPr>$1</w:p>');
uploadZip.file('word/document.xml', documentXml);
const uploadedDocx = await uploadZip.generateAsync({ type: 'nodebuffer' });

const formatted = await Promise.all([sourceTextDocx, uploadedDocx].map(async (source) => {
  const result = await formatDocument(source, { config, options, includeToc: false });
  return createPreview(result.buffer, config, 'processed', options);
}));
const [textPreview, docxPreview] = formatted;
const relevant = preview => ({
  pageCount: preview.pageCount,
  pageSize: [preview.meta.widthCm, preview.meta.heightCm],
  margins: preview.meta.margins,
  typography: [preview.meta.fontFamily, preview.meta.fontSize, preview.meta.lineSpacing],
  pages: preview.pages.map(page => page.blocks.map(block => ({
    type: block.type,
    text: block.text,
    alignment: block.alignment,
    firstLineIndent: block.firstLineIndent,
    lineSpacing: block.lineSpacing,
    headingLevel: block.headingLevel,
    equationCount: (block.runs || []).filter(run => run.math).length,
  }))),
});
assert.deepEqual(relevant(docxPreview), relevant(textPreview), 'Uploaded DOCX and pasted text converge to the same formatted preview layout');
console.log(`PASS: uploaded-DOCX and pasted-text previews converge (${textPreview.pageCount} pages).`);
