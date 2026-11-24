import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { DEFAULT_TEMPLATE_CONFIG } from '../src/templates/defaults.js';
import { buildDocxFromText } from '../src/docx/fromText.js';
import { formatDocument } from '../src/docx/format.js';
import { normalizeCoverTables } from '../src/docx/coverTables.js';
import { readDocxBuffer } from '../src/docx/reader.js';

const config = structuredClone(DEFAULT_TEMPLATE_CONFIG);

const cell = (text) => `<w:tc><w:tcPr><w:tcW w:w="2500" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:tc>`;
const visibleBorders = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
  .map((edge) => `<w:${edge} w:val="single" w:sz="8" w:space="0" w:color="auto"/>`)
  .join('');
const tableXml =
  `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="dxa"/><w:tblBorders>${visibleBorders}</w:tblBorders></w:tblPr>` +
  '<w:tblGrid><w:gridCol w:w="2500"/><w:gridCol w:w="2500"/></w:tblGrid>' +
  `<w:tr>${cell('Nama')}${cell('NIM')}</w:tr>` +
  `<w:tr>${cell('MUHAMMAD FAHRI FIRDAUSSILLAH')}${cell('2605090003')}</w:tr>` +
  '</w:tbl>';

// --- Unit: tabel ber-border di area cover dirapikan.
const docXml = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${tableXml}<w:p><w:r><w:t>BAB I PENDAHULUAN</w:t></w:r></w:p></w:body></w:document>`;
const unit = normalizeCoverTables(docXml, 0);
assert.equal(unit.changed, true, 'tabel cover terdeteksi');
for (const edge of ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']) {
  assert.match(unit.documentXml, new RegExp(`<w:${edge} w:val="nil"/>`), `border tabel ${edge} jadi nil`);
}
assert.doesNotMatch(unit.documentXml, /w:val="single"/, 'tidak ada garis tunggal tersisa');
assert.doesNotMatch(unit.documentXml, />Nama</, 'baris judul Nama dibuang');
assert.doesNotMatch(unit.documentXml, />NIM</, 'baris judul NIM dibuang');
assert.match(unit.documentXml, /MUHAMMAD FAHRI FIRDAUSSILLAH/, 'nama anggota tetap ada');
assert.match(unit.documentXml, /2605090003/, 'NIM anggota tetap ada');
assert.match(unit.documentXml, /<w:tblStyle w:val="TableNormal"\/>/, 'tabel memakai style tanpa garis');

// Tabel di luar cover tidak diubah.
const bodyOnly = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>JUDUL</w:t></w:r></w:p>${tableXml}</w:body></w:document>`;
const bodyTable = normalizeCoverTables(bodyOnly, 0);
assert.equal(bodyTable.changed, false, 'tabel isi makalah dibiarkan');

// --- Integrasi: DOCX berisi tabel cover ber-border ikut dirapikan saat format.
const source = await buildDocxFromText('JUDUL MAKALAH\n\nBAB I PENDAHULUAN\n\nIsi makalah untuk pengujian.');
const zip = await readDocxBuffer(source);
let xml = await zip.file('word/document.xml').async('string');
xml = xml.replace(/(<w:p\b[^>]*>[\s\S]*?<\/w:p>)/, `$1${tableXml}`);
zip.file('word/document.xml', xml);
const injected = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

const formatted = await formatDocument(injected, {
  config,
  options: { cover: true, font: true, fontSize: true, alignment: true, firstLineIndent: true, margins: true, headings: true, lineSpacing: true, paragraphSpacing: true, preface: false, pageNumbering: false, toc: false },
  meta: { members: [{ name: 'MUHAMMAD FAHRI FIRDAUSSILLAH', nim: '2605090003' }], department: '' },
});
const outZip = await JSZip.loadAsync(formatted.buffer);
const out = await outZip.file('word/document.xml').async('string');
assert.doesNotMatch(out, /w:val="single"/, 'DOCX hasil tidak punya garis tabel cover');
assert.doesNotMatch(out, />Nama</, 'header tabel tidak ikut di DOCX hasil');
assert.match(out, /MUHAMMAD FAHRI FIRDAUSSILLAH/, 'nama anggota bertahan di DOCX hasil');
assert.match(out, /<w:tblBorders><w:top w:val="nil"\/>/, 'border tabel hasil transparan');

console.log('PASS: Tabel cover lama dengan border terlihat dirapikan jadi tabel transparan.');
