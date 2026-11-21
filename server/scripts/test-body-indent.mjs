import assert from 'node:assert/strict';
import { buildDocxFromText } from '../src/docx/fromText.js';
import { formatDocument } from '../src/docx/formatIndented.js';
import { indentBody } from '../src/docx/indentBody.js';
import { readDocxBuffer, getBodyStructure } from '../src/docx/reader.js';
import { DEFAULT_TEMPLATE_CONFIG as config } from '../src/templates/defaults.js';

const options = { headings: true, firstLineIndent: true, cover: true, preface: false, alignment: true };
const source = await buildDocxFromText('# BAB I PENDAHULUAN\n\n## 1.1 Latar Belakang\n\nParagraf utama pertama.\n\nParagraf utama kedua.\n\n### 1.1.1 Rincian\n\nParagraf rinci.\n\n1. Item pertama.\n2. Item kedua.\n\n## 1.2 Tujuan\n\nParagraf tujuan.\n\n# DAFTAR PUSTAKA\n\nPenulis. (2026). Judul.');
const result = await formatDocument(source, { config, options });
const xmlOf = async b => (await readDocxBuffer(b)).file('word/document.xml').async('string');
const blocks = getBodyStructure(await xmlOf(result.buffer)).blocks;
let left = 0;
for (const b of blocks) {
  if (/^Heading[23]$/.test(b.data?.styleId || '')) left = b.data.leftIndent;
  if (b.data?.plainText?.startsWith('Paragraf')) {
    assert.equal(b.data.leftIndent, left);
    assert.equal(b.data.firstLineIndent, 709);
  }
}
const again = await indentBody(result.buffer, { config, options });
assert.equal(await xmlOf(again.buffer), await xmlOf(result.buffer));
assert.equal((await indentBody(result.buffer, { config, options: {} })).buffer, result.buffer);
console.log('PASS: All body paragraphs follow subheading text positions, first-line indent, hierarchy reset, idempotence and disabled option.');
