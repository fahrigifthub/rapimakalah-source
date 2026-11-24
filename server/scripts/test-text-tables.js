import assert from 'node:assert/strict';
import { buildDocxFromText, parseText } from '../src/docx/fromText.js';
import { splitTableRow, readTextTable } from '../src/docx/textTables.js';
import { formatDocument } from '../src/docx/format.js';
import { createPreview } from '../src/docx/preview.js';
import { readDocxBuffer } from '../src/docx/reader.js';
import { DEFAULT_TEMPLATE_CONFIG } from '../src/templates/defaults.js';

/**
 * Kasus baru: makalah "Isu Pemindahan Badak Jawa" ditempel sebagai Markdown.
 * Tabel pipe harus menjadi tabel Word sungguhan, bukan paragraf berisi "|".
 */

const makalah = `# ISU PEMINDAHAN BADAK JAWA DARI TAMAN NASIONAL UJUNG KULON

## KATA PENGANTAR

Puji syukur ke hadirat Tuhan Yang Maha Esa karena makalah ini dapat diselesaikan dengan baik.

## BAB I
## PENDAHULUAN

### 1.1 Latar Belakang

Badak Jawa (*Rhinoceros sondaicus*) merupakan salah satu spesies badak paling langka di dunia.

Berikut merupakan karakteristik umum badak Jawa:

| No. | Aspek | Keterangan |
|---|---|---|
| 1 | Nama ilmiah | *Rhinoceros sondaicus* |
| 2 | Jenis hewan | Mamalia |
| 3 | Makanan | Daun, ranting, tunas, dan buah-buahan |
| 4 | Ciri fisik | Memiliki satu cula dan kulit tebal berlipat |
| 5 | Habitat | Hutan hujan tropis dan hutan dataran rendah |
| 6 | Perilaku | Cenderung hidup soliter |
| 7 | Persebaran | Saat ini hanya bertahan di Taman Nasional Ujung Kulon |
| 8 | Status konservasi | Kritis (Critically Endangered) |

### 2.3 Latar Belakang Isu Pemindahan Badak Jawa

Berikut beberapa ancaman yang menjadi alasan munculnya wacana pengembangan habitat kedua:

| No. | Jenis Ancaman | Dampak terhadap Badak Jawa |
|---|---|---|
| 1 | Bencana alam | Dapat menyebabkan kematian dan kerusakan habitat |
| 2 | Penyakit | Berpotensi mengganggu kesehatan dan menurunkan populasi |
| 3 | Keterbatasan habitat | Membatasi ruang hidup dan ketersediaan pakan |
| 4 | Rendahnya keragaman genetik | Meningkatkan risiko perkawinan antarkerabat |
| 5 | Aktivitas manusia | Dapat menyebabkan gangguan dan kerusakan lingkungan |

### 2.6 Alasan yang Menolak atau Mengkhawatirkan Pemindahan Badak Jawa

Berikut perbandingan alasan yang mendukung dan mengkhawatirkan pemindahan badak Jawa:

| No. | Alasan Mendukung | Alasan Mengkhawatirkan |
|---|---|---|
| 1 | Mengurangi risiko kepunahan akibat bencana di satu kawasan | Proses pemindahan dapat menyebabkan stres |
| 2 | Membentuk populasi baru | Habitat baru belum tentu sesuai |
| 3 | Memperluas wilayah konservasi | Membutuhkan biaya yang besar |
| 4 | Mendukung pengelolaan genetik | Berisiko menimbulkan penyebaran penyakit |
| 5 | Memperkuat konservasi jangka panjang | Membutuhkan pengawasan dan penelitian berkelanjutan |

### 2.8 Upaya Pelestarian Badak Jawa

Berikut rangkuman beberapa upaya pelestarian badak Jawa:

| No. | Upaya Pelestarian | Tujuan |
|---|---|---|
| 1 | Perlindungan habitat | Menjaga kelestarian lingkungan alami |
| 2 | Patroli kawasan | Mencegah perburuan dan aktivitas ilegal |
| 3 | Pemantauan kamera jebak | Mengamati populasi dan aktivitas badak |
| 4 | Penelitian genetik | Mengetahui keragaman genetik populasi |
| 5 | Pengembangan habitat kedua | Mengurangi ketergantungan pada satu kawasan |
| 6 | Edukasi masyarakat | Meningkatkan kesadaran konservasi |
| 7 | Kerja sama lembaga | Memperkuat program perlindungan |

### 2.9 Analisis terhadap Isu Pemindahan Badak Jawa

Isu pemindahan badak Jawa dari Taman Nasional Ujung Kulon membutuhkan perencanaan yang tidak sederhana.

## DAFTAR PUSTAKA

1. Balai Taman Nasional Ujung Kulon. https://tnujungkulon.menlhk.go.id/
`;

// --- Parser: empat tabel dikenali, tidak ada baris pipe yang jadi paragraf ---
const blocks = parseText(makalah);
const tables = blocks.filter((block) => block.type === 'table');
assert.equal(tables.length, 4, 'empat tabel Markdown menjadi blok tabel');
assert.deepEqual(tables[0].header, ['No.', 'Aspek', 'Keterangan']);
assert.equal(tables[0].rows.length, 8, 'delapan baris isi pada tabel karakteristik');
assert.deepEqual(tables[1].header, ['No.', 'Jenis Ancaman', 'Dampak terhadap Badak Jawa']);
assert.equal(tables[2].rows.length, 5, 'tabel perbandingan berisi lima baris');
assert.equal(tables[3].rows[6][1], 'Kerja sama lembaga');
assert.ok(
  !blocks.some((block) => block.type !== 'table' && /\|\s*No\.\s*\|/.test(block.text || '')),
  'tidak ada sisa baris tabel yang berubah menjadi paragraf',
);

// Salinan lama mungkin dibuat sebelum parser tabel diperbaiki: tabelnya telah
// tersimpan sebagai beberapa paragraf dengan pipe literal. Formatting harus
// bisa memulihkan tabel tersebut juga.
const legacySource = await buildDocxFromText('Dokumen lama.\n\n| A | B |\n|---|---|\n| 1 | Dua |');
const legacyZip = await readDocxBuffer(legacySource);
let legacyXml = await legacyZip.file('word/document.xml').async('string');
const legacyTable = /<w:tbl\b[\s\S]*?<\/w:tbl>/.exec(legacyXml)?.[0];
assert.ok(legacyTable, 'tabel sumber dibuat untuk fixture lama');
const legacyLines = ['| A | B |', '|---|---|', '| 1 | Dua |'];
const paragraphLines = legacyLines.map((line) => `<w:p><w:r><w:t xml:space="preserve">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</w:t></w:r></w:p>`).join('<w:p/>');
legacyXml = legacyXml.replace(legacyTable, paragraphLines).replace('TABELPLACEHOLDER', 'Dokumen lama.');
legacyZip.file('word/document.xml', legacyXml);
const legacyBuffer = await legacyZip.generateAsync({ type: 'nodebuffer' });
// Simulasikan dokumen versi lama: separator dan semua baris tabel tersimpan sebagai paragraf.
const legacyResult = await formatDocument(legacyBuffer, {
  config: structuredClone(DEFAULT_TEMPLATE_CONFIG),
  options: { cover: false, font: true, fontSize: true, alignment: true, firstLineIndent: true, margins: true, headings: true, lineSpacing: true, paragraphSpacing: true, preface: false, pageNumbering: false, toc: false },
  meta: {},
});
const legacyFormatted = await readDocxBuffer(legacyResult.buffer);
legacyXml = await legacyFormatted.file('word/document.xml').async('string');
assert.equal((legacyXml.match(/<w:tblCaption w:val="RapiMakalah Text Table"\/>/g) || []).length, 1,
  'formatting memulihkan tabel dari baris pipe pada dokumen lama');
assert.ok(legacyResult.report.appliedRules.some((item) => item.includes('Tabel Markdown terdeteksi ulang')),
  'laporan menandai tabel lama yang berhasil dipulihkan');
const legacyPreview = await createPreview(legacyResult.buffer, DEFAULT_TEMPLATE_CONFIG, 'processed', {
  cover: false, font: true, fontSize: true, alignment: true, firstLineIndent: true,
  margins: true, headings: true, lineSpacing: true, paragraphSpacing: true,
  preface: false, pageNumbering: false, toc: false,
});
const legacyPreviewTables = legacyPreview.pages.flatMap((page) => page.blocks).filter((block) => block.type === 'table');
assert.equal(legacyPreviewTables.length, 1, 'preview memulihkan tabel dari baris pipe yang dipisahkan paragraf kosong');
assert.deepEqual(legacyPreviewTables[0].rows.map((row) => row.map((cell) => cell.text)), [['A', 'B'], ['1', 'Dua']]);

// Baris dengan pipe tapi bukan tabel Markdown tetap paragraf biasa.
const notTable = parseText('Kalimat ini memakai tanda | tetapi bukan tabel.\n\nParagraf berikutnya.');
assert.equal(notTable.filter((block) => block.type === 'table').length, 0, 'pipe tanpa baris pemisah bukan tabel');

// Pipe yang di-escape tetap menjadi isi sel, bukan pemisah kolom.
assert.deepEqual(splitTableRow('| A \\| B | C |'), ['A | B', 'C']);
const escaped = readTextTable(['| No. | Catatan |', '|---|:---:|', '| 1 | A \\| B |'], 0);
assert.equal(escaped.table.rows[0][1], 'A | B', 'pipe escaped dibaca sebagai teks');

// Baris pemisah harus sepadan; kalau tidak, jangan menebak sebagai tabel.
assert.equal(readTextTable(['| A | B |', '|---|', '| 1 | 2 |'], 0), null, 'jumlah kolom pemisah harus sama');

// --- DOCX mentah: tabel Word dengan header, border, dan lebar penuh ---
const source = await buildDocxFromText(makalah);
const zip = await readDocxBuffer(source);
const rawXml = await zip.file('word/document.xml').async('string');
assert.equal((rawXml.match(/<w:tbl>/g) || []).length, 4, 'DOCX berisi empat tabel');
assert.equal((rawXml.match(/<w:tblHeader\/>/g) || []).length, 4, 'setiap tabel mengulang baris header');
assert.match(rawXml, /<w:tblCaption w:val="RapiMakalah Text Table"\/>/, 'tabel Markdown diberi penanda internal yang aman');
assert.match(rawXml, /<w:tblW w:w="5000" w:type="pct"\/>/, 'tabel memakai lebar penuh halaman');
assert.match(rawXml, /<w:insideH w:val="single" w:sz="4"/, 'tabel isi makalah tetap bergaris');
assert.match(rawXml, /<w:gridCol w:w="\d+"\/>/, 'kolom tabel punya lebar eksplisit');
const firstTable = /<w:tbl>[\s\S]*?<\/w:tbl>/.exec(rawXml)[0];
assert.equal((firstTable.match(/<w:gridCol /g) || []).length, 3, 'tabel karakteristik punya tiga kolom');
assert.equal((firstTable.match(/<w:tr>/g) || []).length, 9, 'header ditambah delapan baris isi');
assert.match(firstTable, /<w:b\/>/, 'teks header tebal');
assert.match(firstTable, /<w:i\/>/, 'italic pada nama ilmiah dipertahankan');
assert.ok(firstTable.includes('Rhinoceros sondaicus'), 'isi sel tetap utuh');
assert.ok(!/<w:p\b[^>]*>(?:(?!<\/w:p>)[\s\S])*\| No\. \|/.test(rawXml), 'tidak ada paragraf berisi baris pipe');

// --- Setelah formatting: tabel tidak berubah menjadi teks dan fontnya seragam ---
const config = structuredClone(DEFAULT_TEMPLATE_CONFIG);
const options = {
  cover: true, font: true, fontSize: true, alignment: true, firstLineIndent: true,
  margins: true, headings: true, lineSpacing: true, paragraphSpacing: true,
  preface: false, pageNumbering: false, toc: false,
};
const result = await formatDocument(source, {
  config,
  options,
  meta: { title: 'Isu Pemindahan Badak Jawa', author: 'Penulis', institution: 'Universitas', department: '' },
});
const formattedZip = await readDocxBuffer(result.buffer);
const formattedXml = await formattedZip.file('word/document.xml').async('string');
assert.equal((formattedXml.match(/<w:tbl>/g) || []).length, 4, 'tabel bertahan setelah diformat');
assert.equal((formattedXml.match(/<w:tblHeader\/>/g) || []).length, 4, 'header tabel tetap ditandai');
assert.match(formattedXml, /<w:rFonts[^>]*w:ascii="Times New Roman"/, 'font tabel mengikuti template');
assert.match(formattedXml, /<w:sz w:val="24"\/>/, 'ukuran teks tabel mengikuti template');
assert.ok(!/<w:p\b[^>]*>(?:(?!<\/w:p>)[\s\S])*\| No\. \|/.test(formattedXml), 'formatting tidak mengembalikan tabel ke paragraf pipe');

// --- Preview: tabel dirender sebagai tabel dengan header tebal ---
const preview = await createPreview(result.buffer, config, 'processed', options);
const previewTables = preview.pages.flatMap((page) => page.blocks).filter((block) => block.type === 'table');
assert.equal(previewTables.length, 4, 'preview menampilkan empat tabel');
assert.equal(previewTables[0].headerRows, 1, 'baris pertama ditandai sebagai header');
assert.equal(previewTables[0].rows.length, 9, 'preview memuat header dan seluruh baris');
assert.deepEqual(
  previewTables[0].rows[1].map((cell) => cell.text),
  ['1', 'Nama ilmiah', 'Rhinoceros sondaicus'],
  'isi sel tampil rapi tanpa tanda Markdown',
);
assert.ok(
  !preview.pages.flatMap((page) => page.blocks).some((block) => block.type === 'paragraph' && /\| No\. \|/.test(block.text || '')),
  'preview tidak menampilkan baris pipe sebagai paragraf',
);
const coverPreview = preview.pages[0];
const institution = coverPreview.blocks.find((block) => block.bottomFrame && block.text?.includes('[PROGRAM STUDI]'));
assert.ok(institution, 'preview menandai blok institusi cover sebagai bottom frame');
assert.equal(institution.isCover, true, 'blok institusi tetap terdeteksi sebagai bagian cover');

// Cover bawaan harus selalu menampilkan blok bawah dalam preview halaman cover.
const institutionTop = coverPreview.blocks.indexOf(institution);
assert.ok(institutionTop > 0, 'blok institusi berada sesudah isi cover, bukan awal halaman');

console.log('PASS: Tabel Markdown pada teks tempelan menjadi tabel Word yang rapi dan tetap utuh setelah formatting.');
