import assert from 'node:assert/strict';
import { buildCoverXml } from '../src/docx/frontmatter.js';
import { DEFAULT_TEMPLATE_CONFIG } from '../src/templates/defaults.js';
import { buildDocxFromText } from '../src/docx/fromText.js';
import { formatDocument } from '../src/docx/format.js';
import { createPreview } from '../src/docx/preview.js';
import { readDocxBuffer } from '../src/docx/reader.js';

const config = structuredClone(DEFAULT_TEMPLATE_CONFIG);
const members = [
  { name: 'Lusi Irmasanti', nim: '2603070051' },
  { name: 'Savana Atqiya', nim: '2603070052' },
  { name: 'Fadhillah Ramadhani', nim: '2603070055' },
  { name: 'Leo Wira Augusta', nim: '2603070062' },
  { name: 'Zahrotun Nashika', nim: '2603070088' },
];

const xml = buildCoverXml(config, { members, department: '' });
assert.match(xml, /<w:tbl>/, 'cover multi-anggota memakai tabel');
assert.match(xml, /w:tblCaption w:val="RapiMakalah Cover Members"/, 'caption tabel dikenali preview');
const institutionParagraphs = [...xml.matchAll(/<w:p>[\s\S]*?<\/w:p>/g)]
  .map((match) => match[0])
  .filter((paragraph) => /\[(?:PROGRAM STUDI|FAKULTAS|UNIVERSITAS)\]|>2026</.test(paragraph));
assert.equal(institutionParagraphs.length, 1, 'blok institusi memakai satu paragraf agar tidak ada jarak besar');
assert.equal((institutionParagraphs[0].match(/<w:br\/>/g) || []).length, 3, 'empat baris dipisah line break di paragraf yang sama');
assert.match(institutionParagraphs[0], /<w:framePr\b[^>]*w:yAlign="bottom"/, 'paragraf institusi ditambatkan di bawah halaman');

const crowdedCover = buildCoverXml(config, {
  members: Array.from({ length: 12 }, (_, index) => ({ name: `ANGGOTA ${index + 1}`, nim: `26030700${String(index + 1).padStart(2, '0')}` })),
  logoRid: 'rIdTestLogo',
  logoSize: 5,
  department: '',
});
assert.match(crowdedCover, /<w:framePr[^>]*w:yAlign="bottom"/, 'blok institusi tetap ditambatkan di bawah meski ada logo dan banyak anggota');
assert.match(crowdedCover, /<w:keepNext\/>/, 'blok institusi tetap dijaga sebagai satu kelompok pada cover padat');
assert.match(xml, /<w:tblStyle w:val="TableNormal"\/>/, 'tabel memakai style tanpa border');
assert.match(xml, /<w:jc w:val="center"\/>/, 'tabel berada di tengah');
assert.match(xml, /<w:tblLayout w:type="fixed"\/>/, 'lebar kolom tetap');
assert.equal((xml.match(/<w:tr>/g) || []).length, members.length, 'satu baris per anggota');
assert.equal((xml.match(/<w:gridCol /g) || []).length, 2, 'dua kolom nama dan NIM');
const gridWidths = [...xml.matchAll(/<w:gridCol w:w="(\d+)"\/>/g)].map((match) => Number(match[1]));
assert.ok(Math.abs(gridWidths[0] - gridWidths[1]) <= 1, 'lebar kolom nama dan NIM sama-sama 50% (toleransi pembulatan 1 twip)');
assert.doesNotMatch(xml, /<w:gridSpan /, 'tidak ada gridSpan saat semua anggota punya NIM');

const borderBlock = /<w:tblBorders>([\s\S]*?)<\/w:tblBorders>/.exec(xml)?.[1] || '';
for (const edge of ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']) {
  assert.match(borderBlock, new RegExp(`<w:${edge} w:val="nil"/>`), `border ${edge} disembunyikan`);
}
assert.doesNotMatch(borderBlock, /w:val="(?:single|double|dashed|dotted)"/, 'tidak ada border terlihat');
assert.match(xml, /<w:tblCellMar>/, 'margin sel dinolkan');
const memberParagraphs = [...xml.matchAll(/<w:tc>[\s\S]*?<w:p>[\s\S]*?<\/w:p>[\s\S]*?<\/w:tc>/g)].map((match) => match[0]);
assert.equal(memberParagraphs.length, members.length * 2, 'satu paragraf sel untuk nama dan satu untuk NIM');
for (const paragraph of memberParagraphs) {
  assert.doesNotMatch(paragraph, /<w:b(?:Cs)?\b(?![^>]*w:val="0")/, 'nama dan NIM tidak bold');
}
assert.match(xml, /<w:tcBorders><w:top w:val="nil"\/>/, 'border sel juga disembunyikan');
for (const member of members) {
  assert.ok(xml.includes(member.name), `nama ${member.name} ada di cover`);
  assert.ok(xml.includes(member.nim), `NIM ${member.nim} ada di cover`);
}

// Satu anggota tetap memakai satu baris teks, bukan tabel dua kolom.
const single = buildCoverXml(config, { members: [members[0]], department: '' });
assert.match(single, /<w:tbl>/, 'satu anggota juga memakai tabel dua kolom');
assert.match(single, /Lusi Irmasanti/);
assert.match(single, /2603070051/);
assert.equal((single.match(/<w:tr>/g) || []).length, 1, 'satu baris untuk satu anggota');

// Bila tidak ada NIM sama sekali, nama tetap paragraf biasa, bukan tabel dua kolom.
const noNim = buildCoverXml(config, { members: [{ name: 'ANGGOTA TANPA NIM' }], department: '' });
assert.doesNotMatch(noNim, /<w:tbl>/);
const noNimMulti = buildCoverXml(config, { members: [{ name: 'SATU' }, { name: 'DUA' }], department: '' });
assert.doesNotMatch(noNimMulti, /<w:tbl>/);
assert.match(noNimMulti, /SATU/);
assert.match(noNimMulti, /DUA/);

// Tabel harus bertahan setelah formatDocument, tidak dikonversi kembali ke paragraf.
const source = await buildDocxFromText('BAB I PENDAHULUAN\n\nIsi makalah untuk pengujian tabel anggota.');
const options = { cover: true, font: true, fontSize: true, alignment: true, firstLineIndent: true, margins: true, headings: true, lineSpacing: true, paragraphSpacing: true, preface: false, pageNumbering: false, toc: false };
const result = await formatDocument(source, { config, options, meta: { members, department: '' } });
const zip = await readDocxBuffer(result.buffer);
const output = await zip.file('word/document.xml').async('string');
const formattedInstitutionParagraphs = [...output.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)]
  .map((match) => match[0])
  .filter((paragraph) => /\[(?:PROGRAM STUDI|FAKULTAS|UNIVERSITAS)\]|>2026</.test(paragraph));
assert.equal(formattedInstitutionParagraphs.length, 1, 'hasil format menggabungkan institusi ke satu paragraf');
assert.match(formattedInstitutionParagraphs[0], /<w:framePr\b[^>]*w:yAlign="bottom"/, 'hasil format mempertahankan jangkar bawah');
assert.match(formattedInstitutionParagraphs[0], /<w:keepLines\/>/, 'baris institusi tidak terpotong');
assert.equal((formattedInstitutionParagraphs[0].match(/<w:br\/>/g) || []).length, 3, 'empat baris institusi tetap terpisah rapi');
assert.match(output, /RapiMakalah Cover Members/, 'tabel anggota tidak dihapus saat formatting');
assert.match(output, /Lusi Irmasanti/, 'nama contoh anggota masuk ke DOCX hasil');
assert.match(output, /2603070051/, 'NIM contoh anggota masuk ke DOCX hasil');
assert.match(output, /<w:tblBorders><w:top w:val="nil"\/>/, 'border tabel tetap tersembunyi di DOCX hasil');

const preview = await createPreview(result.buffer, config, 'processed', options);
const blocks = preview.pages.flatMap((page) => page.blocks);
const memberTable = blocks.find((block) => block.isMemberTable);
assert.ok(memberTable, 'preview menampilkan tabel anggota');
assert.equal(memberTable.rows.length, members.length, 'satu baris per anggota di preview');
for (const member of members) {
  assert.ok(
    memberTable.rows.some((row) => row[0]?.text === member.name && row[1]?.text === member.nim),
    `preview menampilkan kolom ${member.name} dan ${member.nim}`,
  );
}
assert.ok(
  !blocks.some((block) => block.text === `${members[0].name} (${members[0].nim})`),
  'preview tidak lagi menggabungkan nama dan NIM jadi satu baris',
);

console.log('PASS: Tabel anggota cover menjaga nama/NIM regular, kolom 50/50, dan border tersembunyi.');
