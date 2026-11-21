import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { buildDocxFromText } from '../src/docx/fromText.js';
import { formatDocument } from '../src/docx/format.js';
import { analyzeDocument } from '../src/docx/checker.js';
import { DEFAULT_TEMPLATE_CONFIG } from '../src/templates/defaults.js';
import { getBodyStructure } from '../src/docx/reader.js';
import { setParagraphProperty } from '../src/docx/xml.js';

const config = structuredClone(DEFAULT_TEMPLATE_CONFIG);
const options = { margins: true, font: true, fontSize: true, lineSpacing: true, firstLineIndent: true, alignment: true, headings: true, paragraphSpacing: true, pageNumbering: false, toc: false, cover: false, preface: true };
const input = await buildDocxFromText([
  'KATA PENGANTAR',
  'Puji syukur kepada Tuhan atas terselesaikannya makalah ini.',
  'Semarang, 16 November 2026',
  'Penulis',
  'BAB I PENDAHULUAN',
  'Penulis menjelaskan latar belakang penelitian dalam paragraf isi ini.',
  'A. Indeks Bias Mutlak (n)',
  'Uraian pertama BREAK Uraian kedua.',
  'DAFTAR PUSTAKA',
  'Contoh, A. (2026). Pengantar fisika. Penerbit Ilmu.',
].join('\n\n'));
const sourceZip = await JSZip.loadAsync(input);
sourceZip.file('word/document.xml', (await sourceZip.file('word/document.xml').async('string')).replace(' BREAK ', '</w:t><w:br/><w:t>'));
const formatted = await formatDocument(await sourceZip.generateAsync({ type: 'nodebuffer' }), { config, options, includeToc: false });
const analysis = await analyzeDocument(formatted.buffer, config);
for (const key of ['indentation', 'alignment']) {
  assert.equal(analysis.checks.find(c => c.key === key).status, 'ok', JSON.stringify(analysis.checks.find(c => c.key === key)));
}

// Deliberately damage each role. Context-specific checks must still detect it.
const zip = await JSZip.loadAsync(formatted.buffer);
let xml = await zip.file('word/document.xml').async('string');
const blocks = getBodyStructure(xml).blocks;
const targets = [
  ['Semarang,', 'right', 0],
  ['Penulis menjelaskan', 'both', 1.25],
  ['A.', 'left', 0.75],
  ['Uraian pertama', 'left', 1.25],
  ['Contoh, A.', 'both', 1.27],
];
for (const [prefix] of targets) {
  const block = blocks.find(b => b.data?.plainText.startsWith(prefix));
  assert.ok(block, prefix);
  let bad = setParagraphProperty(block.xml, 'w:ind', '<w:ind w:firstLine="1701" w:hanging="0"/>');
  bad = setParagraphProperty(bad, 'w:jc', '<w:jc w:val="center"/>');
  xml = xml.replace(block.xml, bad);
}
zip.file('word/document.xml', xml);
const damaged = await analyzeDocument(await zip.generateAsync({ type: 'nodebuffer' }), config);
for (const [prefix, alignment, indent] of targets) {
  const issues = damaged.checks.flatMap(c => c.issues).filter(i => i.snippet?.startsWith(prefix));
  assert.ok(issues.some(i => i.code === 'ALIGN_MISMATCH' && i.expected === alignment), `${prefix}: wrong alignment must be detected`);
  assert.ok(issues.some(i => i.code === 'INDENT_MISMATCH' && Math.abs(i.expected - indent) < 0.02), `${prefix}: wrong indent must be detected`);
}
assert.ok(damaged.score < analysis.score, 'Real formatting defects still lower the score');
console.log('PASS: Correct signature, lettered labels, soft breaks and bibliography pass; damaged formatting and ordinary body text still fail.');
