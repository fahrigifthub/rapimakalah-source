import assert from 'node:assert/strict';
import { buildPreviewPages } from '../src/docx/preview.js';
import { DEFAULT_TEMPLATE_CONFIG } from '../src/templates/defaults.js';
import { escapeXml } from '../src/docx/xml.js';

// Seven long references with hanging indents, paragraph gaps, and DOI links.
// Their combined character count fits the old estimate but their wrapped
// lines and spacing require a continuation page.
const names = ['Gunaryadi', 'Halawa', 'Harahap', 'KLHK 2018', 'KLHK 2024', 'Panjaitan', 'Purwanuriski'];
const lengths = [270, 280, 330, 380, 200, 290, 360];
const references = names.map((name, i) => `${name}. (2024). ${'Konflik manusia dan gajah Sumatera serta konservasi habitat. '.repeat(8).slice(0, lengths[i])} https://doi.org/${i === 6 ? '10.29303/jbl.v5i1.865' : '10.1371/journal.pone.0173742'}`);
const paragraph = (text, props = '') => `<w:p><w:pPr>${props}</w:pPr><w:r><w:t>${escapeXml(text)}</w:t></w:r></w:p>`;
const xml = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraph('DAFTAR PUSTAKA')}${references.map(text => paragraph(text, '<w:pStyle w:val="Bibliography"/><w:ind w:left="720" w:hanging="720"/><w:spacing w:line="360" w:after="120"/>')).join('')}</w:body></w:document>`;
export const bibliographyPreview = buildPreviewPages(xml, new Map(), DEFAULT_TEMPLATE_CONFIG);
assert.ok(bibliographyPreview.pages.length > 1, 'Long bibliography continues onto another page');
const rendered = bibliographyPreview.pages.flatMap(page => page.blocks).slice(1);
assert.deepEqual(rendered.map(block => block.text), references, 'All seven references and their DOI links remain intact and ordered');
assert.ok(rendered.every(block => block.hangingIndent > 1.2 && block.spaceAfter === 6));
assert.ok(bibliographyPreview.pages.at(-1).blocks.at(-1).text.endsWith('10.29303/jbl.v5i1.865'));
console.log('PASS: Seven hanging-indent references continue across pages without losing the last reference or DOI.');
