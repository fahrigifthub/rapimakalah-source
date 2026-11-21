import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { formatDocument } from '../src/docx/format.js';
import { DEFAULT_TEMPLATE_CONFIG } from '../src/templates/defaults.js';

const zip = await JSZip.loadAsync(await fs.readFile(new URL('../test-fixture.docx', import.meta.url)));
let xml = await zip.file('word/document.xml').async('string');
let injected = 0;
xml = xml.replace(/<w:p>(?!<w:pPr>)/g, () => {
  injected += 1;
  return '<w:p><w:pPr><w:ind w:left="-1700" w:right="900" w:firstLine="100"/></w:pPr>';
});
zip.file('word/document.xml', xml);
const input = await zip.generateAsync({ type: 'nodebuffer' });

const options = {
  margins: true, font: true, fontSize: true, lineSpacing: true, firstLineIndent: true,
  alignment: true, headings: true, paragraphSpacing: true, pageNumbering: true, toc: true, cover: false, preface: true,
};
const result = await formatDocument(input, { config: structuredClone(DEFAULT_TEMPLATE_CONFIG), options, includeToc: true, meta: {} });
const out = await (await JSZip.loadAsync(result.buffer)).file('word/document.xml').async('string');
const inds = out.match(/<w:ind [^>]*>/g) || [];
console.log('injected paragraphs:', injected);
console.log('distinct <w:ind> after format:', [...new Set(inds)]);
const bad = inds.filter((tag) => /w:(left|right|start|end)="-/.test(tag));
console.log('indents still outside margin:', bad.length);
process.exit(bad.length ? 1 : 0);
