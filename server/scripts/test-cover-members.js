import assert from 'node:assert/strict';
import { buildCoverXml } from '../src/docx/frontmatter.js';
import { DEFAULT_TEMPLATE_CONFIG } from '../src/templates/defaults.js';
import { buildDocxFromText } from '../src/docx/fromText.js';
import { formatDocument } from '../src/docx/format.js';
import { createPreview } from '../src/docx/preview.js';
import { readDocxBuffer } from '../src/docx/reader.js';

const config = structuredClone(DEFAULT_TEMPLATE_CONFIG);
const members = [{ name: 'Anggota Satu', nim: '0000001' }, { name: 'Anggota Dua', nim: '0000002' }];
const xml = buildCoverXml(config, { members, department: '' });
assert.match(xml, /<w:tbl>/);
assert.match(xml, /RapiMakalah Cover Members/);
assert.match(xml, /<w:tblBorders><w:top w:val="nil"\/><w:left w:val="nil"\/><w:bottom w:val="nil"\/><w:right w:val="nil"\/><w:insideH w:val="nil"\/><w:insideV w:val="nil"\/><\/w:tblBorders>/);
assert.match(xml, /Anggota Satu/);
assert.match(xml, /0000001/);
assert.doesNotMatch(xml, /\[DEPARTEMEN\]/);
assert.match(buildCoverXml(config, { members, department: 'Departemen Teknik' }), /DEPARTEMEN TEKNIK/);
config.cover.defaults = { department: 'Departemen Bawaan', members };
const source = await buildDocxFromText('BAB I PENDAHULUAN\n\nIsi makalah untuk pengujian cover.');
const options = { cover: true, font: true, fontSize: true, alignment: true, firstLineIndent: true, margins: true, headings: true, lineSpacing: true, paragraphSpacing: true, preface: false, pageNumbering: false, toc: false };
const result = await formatDocument(source, { config, options, meta: { members, department: '' } });
const zip = await readDocxBuffer(result.buffer);
const output = await zip.file('word/document.xml').async('string');
assert.doesNotMatch(output, /Departemen Bawaan|DEPARTEMEN BAWAAN/);
const preview = await createPreview(result.buffer, config, 'processed', options);
const blocks = preview.pages.flatMap(p => p.blocks);
const memberTable = blocks.find(b => b.isMemberTable);
assert.ok(memberTable, 'preview memakai tabel anggota');
for (const member of members) {
  assert.ok(memberTable.rows.some(row => row[0]?.text === member.name && row[1]?.text === member.nim), `preview memuat ${member.name} dan ${member.nim}`);
}
console.log('PASS: Cover members use centered text with NIM and department remains optional.');
