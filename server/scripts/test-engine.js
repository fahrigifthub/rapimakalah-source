import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { formatDocument } from '../src/docx/format.js';
import { analyzeDocument } from '../src/docx/checker.js';
import { createPreview } from '../src/docx/preview.js';
import { DEFAULT_TEMPLATE_CONFIG } from '../src/templates/defaults.js';
import { getBodyStructure, getSectionProperties, parseStyles, readDocxBuffer } from '../src/docx/reader.js';

const input = await fs.readFile(new URL('../test-fixture.docx', import.meta.url));
const numberedCoverZip = await JSZip.loadAsync(input);
const numberedCoverXml = await numberedCoverZip.file('word/document.xml').async('string');
const numberedCoverParagraph = `<w:p><w:pPr><w:jc w:val="left"/><w:ind w:left="720" w:hanging="360"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr></w:pPr><w:r><w:t>TEST COVER MEMBER</w:t></w:r></w:p>`;
const firstParagraph = /<w:p\b[\s\S]*?<\/w:p>/.exec(numberedCoverXml);
assert.ok(firstParagraph, 'Fixture has a paragraph to serve as a cover boundary');
numberedCoverZip.file('word/document.xml', numberedCoverXml.replace(firstParagraph[0], firstParagraph[0] + numberedCoverParagraph));
const numberedCoverInput = await numberedCoverZip.generateAsync({ type: 'nodebuffer' });
const config = structuredClone(DEFAULT_TEMPLATE_CONFIG);
const options = {
  cover: true,
  margins: true,
  font: true,
  fontSize: true,
  lineSpacing: true,
  firstLineIndent: true,
  alignment: true,
  headings: true,
  paragraphSpacing: true,
  pageNumbering: true,
  toc: true,
};

const before = await analyzeDocument(input, config);
console.log('BEFORE score', before.score, 'issues', before.issueCount, 'headings', before.headings.map((h) => `${h.level}:${h.text}`));

const result = await formatDocument(input, { config, options, includeToc: true });
const numberedCoverResult = await formatDocument(numberedCoverInput, { config, options: { ...options, pageNumbering: false }, boundaries: { coverEnd: 1 }, includeToc: false });
// Test outputs go to the OS temp directory rather than the source tree.
await fs.writeFile(path.join(tmpdir(), 'rapimakalah-processed-fixture.docx'), result.buffer);
console.log('REPORT', JSON.stringify({ applied: result.report.appliedRules, warnings: result.report.warnings, sections: result.report.sections, stats: result.report.stats, boundaries: result.report.boundaries }, null, 2));

const after = await analyzeDocument(result.buffer, config);
console.log('AFTER score', after.score, 'issues', after.issueCount);
console.log(after.checks.map((c) => `${c.status.toUpperCase()} ${c.label}: ${c.summary}`));

const zip = await readDocxBuffer(result.buffer);
const xml = await zip.file('word/document.xml').async('string');
const stylesXml = await zip.file('word/styles.xml').async('string');
const structure = getBodyStructure(xml);
console.log('\nSECTIONS', JSON.stringify(getSectionProperties(structure.blocks), null, 2));
console.log('FOOTER references:', (xml.match(/w:footerReference[^>]*/g) || []));
console.log('pgNumType:', (xml.match(/<w:pgNumType[^>]*>/g) || []));
console.log('TOC field:', (xml.match(/<w:instrText[^>]*>([^<]*)<\/w:instrText>/g) || []).slice(0, 5));
console.log('Table kept:', /<w:tbl>/.test(xml), 'Image kept:', /<a:blip/.test(xml), 'Hyperlink kept:', /<w:hyperlink/.test(xml));
console.log('Files:', Object.keys(zip.files).filter((f) => f.startsWith('word/') && (f.includes('footer') || f.includes('header'))));
console.log('Content types footer:', ((await zip.file('[Content_Types].xml').async('string')).match(/footer[^"]*/g) || []).slice(0, 4));
console.log('updateFields:', /<w:updateFields/.test(await zip.file('word/settings.xml').async('string')));

const preview = await createPreview(result.buffer, config, 'processed', options);
const coverBlocks = preview.pages[0]?.blocks || [];
assert.ok(coverBlocks.length > 0 && coverBlocks.every((block) => block.alignment === 'center'), 'All blocks on the formatted cover preview are centered');
assert.ok(coverBlocks.every((block) => !block.firstLineIndent && !block.leftIndent && !block.hangingIndent), 'Cover preview has no inherited paragraph indents');
assert.ok(coverBlocks.filter((block) => block.hasNumbering).every((block) => block.isCover && block.numberMarker === null), 'Numbered members on the cover do not render list markers');
const numberedCoverPreview = await createPreview(numberedCoverResult.buffer, config, 'processed', options);
const injectedMember = numberedCoverPreview.pages.flatMap((page) => page.blocks).find((block) => block.text?.includes('TEST COVER MEMBER'));
assert.ok(injectedMember?.isCover && injectedMember.alignment === 'center', 'Injected numbered cover member stays centered');
assert.equal(injectedMember.numberMarker, null, 'Injected cover member has no visual list marker');
assert.equal(injectedMember.hasNumbering, false, 'DOCX cover normalization removes auto-numbering');
const numberedCoverProcessedZip = await readDocxBuffer(numberedCoverResult.buffer);
const numberedCoverProcessedXml = await numberedCoverProcessedZip.file('word/document.xml').async('string');
const injectedMemberXml = /<w:p\b[\s\S]*?<w:t>TEST COVER MEMBER<\/w:t>[\s\S]*?<\/w:p>/.exec(numberedCoverProcessedXml)?.[0];
assert.ok(injectedMemberXml, 'Injected cover member remains in the formatted DOCX');
assert.doesNotMatch(injectedMemberXml, /<w:numPr>/, 'Formatted cover member does not retain OOXML numbering');
const formattedZip = await readDocxBuffer(result.buffer);
const formattedXml = await formattedZip.file('word/document.xml').async('string');
const formattedStructure = getBodyStructure(formattedXml);
const coverEnd = result.report.boundaries.coverEnd;
for (const block of formattedStructure.blocks.slice(0, coverEnd + 1).filter((item) => item.type === 'w:p' && item.data?.plainText)) {
  assert.match(block.xml, /<w:jc w:val="center"\/>/, `Cover paragraph ${block.index} is centered in the DOCX`);
  assert.match(block.xml, /<w:ind\b[^>]*w:left="0"[^>]*w:right="0"[^>]*w:firstLine="0"[^>]*w:hanging="0"/, `Cover paragraph ${block.index} has zeroed indents in the DOCX`);
}
console.log('PREVIEW pages', preview.pageCount, 'headings', preview.headings.length, 'first page texts', coverBlocks.map((b) => b.text).slice(0, 4), 'images', preview.pages.flatMap((p) => p.blocks).filter((b) => b.images?.length).length);

// verify XML well-formedness roughly by requiring python-docx later
