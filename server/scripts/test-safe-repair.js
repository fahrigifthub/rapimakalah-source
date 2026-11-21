import assert from 'node:assert/strict';
import { buildDocxFromText } from '../src/docx/fromText.js';
import { formatDocument } from '../src/docx/format.js';
import { repairFormattedDocx } from '../src/docx/safeRepair.js';
import { createPreview } from '../src/docx/previewRepaired.js';
import { readDocxBuffer, getBodyStructure } from '../src/docx/reader.js';
import { DEFAULT_TEMPLATE_CONFIG } from '../src/templates/defaults.js';

const config = structuredClone(DEFAULT_TEMPLATE_CONFIG);
const options = { cover: true, preface: false, toc: true, headings: true, pageNumbering: true, font: true, fontSize: true, firstLineIndent: true, alignment: true };
const source = await buildDocxFromText('# BAB I PENDAHULUAN\n\n## 1.1 Latar Belakang\n\nParagraf isi yang cukup panjang untuk memastikan aturan indentasi dapat diperiksa setelah heading.\n\n**1. Manfaat Teoretis**\n\nPenjelasan manfaat teoretis bagi masyarakat dan pembaca.\n\n1. Item daftar pertama.\n2. Item daftar kedua.\n\n# DAFTAR PUSTAKA\n\nPenulis. (2026). Referensi contoh.');
const formatted = await formatDocument(source, { config, options, includeToc: true });
const xmlOf = async buffer => (await readDocxBuffer(buffer)).file('word/document.xml').async('string');
const before = getBodyStructure(await xmlOf(formatted.buffer));
const repaired = await repairFormattedDocx(formatted.buffer, { config, options });
assert.equal(repaired.changed, true);
const after = getBodyStructure(await xmlOf(repaired.buffer));
assert.deepEqual(after.blocks.filter(b => !/^TOC/.test(b.data?.styleId || '')).map(b => b.data?.plainText), before.blocks.filter(b => !/^TOC/.test(b.data?.styleId || '')).map(b => b.data?.plainText));
const body = after.blocks.find(b => b.data?.plainText?.startsWith('Paragraf isi'));
assert.equal(body.data.leftIndent, 0);
assert.equal(body.data.firstLineIndent, 709);
const label = after.blocks.find(b => b.data?.plainText === '1. Manfaat Teoretis');
assert.match(label.xml, /<w:keepNext\/>/);
assert.match(label.xml, /<w:tab\/>/);
for (const b of before.blocks.filter(b => b.data?.hasNumbering && !b.data.styleId || b.data?.styleId === 'Bibliography')) assert.equal(after.blocks[b.index].xml, b.xml);
const bodyStart = before.blocks.findIndex(b => /^BAB I/.test(b.data?.plainText || ''));
for (const b of before.blocks.slice(0, bodyStart).filter(b => !/^TOC/.test(b.data?.styleId || ''))) assert.equal(after.blocks[b.index].xml, b.xml);
const second = await repairFormattedDocx(repaired.buffer, { config, options });
assert.equal(await xmlOf(second.buffer), await xmlOf(repaired.buffer), 'Repair must be idempotent');
const disabled = await repairFormattedDocx(formatted.buffer, { config, options: {} });
assert.equal(await xmlOf(disabled.buffer), await xmlOf(formatted.buffer));
assert.ok((await (await readDocxBuffer(repaired.buffer)).file('[Content_Types].xml').async('string')).includes('application/json'));
const preview = await createPreview(repaired.buffer, config, 'processed', options);
for (const b of preview.pages.flatMap(p => p.blocks).filter(b => /^TOC\d/.test(b.styleId || ''))) {
  assert.equal(b.alignment, 'left');
  assert.equal(b.firstLineIndent, null);
}
console.log('PASS: Body indent, heading/label grouping, TOC preview, text/cover/list/bibliography preservation, disabled options and idempotence.');
