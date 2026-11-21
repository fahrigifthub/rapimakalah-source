import assert from 'node:assert/strict';
import { buildPreviewPages } from '../src/docx/preview.js';
import { parseStyles } from '../src/docx/reader.js';
import { latexToOmml } from '../src/docx/omml.js';
import { escapeXml } from '../src/docx/xml.js';
import { DEFAULT_TEMPLATE_CONFIG } from '../src/templates/defaults.js';

const run = text => `<w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
const p = (content, props = '') => `<w:p><w:pPr>${props}</w:pPr>${content}</w:p>`;
const document = content => `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><w:body>${content}</w:body></w:document>`;
const build = (content, styles = new Map(), options = {}) => buildPreviewPages(document(content), styles, DEFAULT_TEMPLATE_CONFIG, {}, null, options);
const all = preview => preview.pages.flatMap(page => page.blocks);
const math = preview => all(preview).flatMap(block => block.runs || []).filter(run => run.math);

const expressions = [
  String.raw`n = \frac{c}{v}`,
  String.raw`n_1 \sin\theta_1 = n_2 \sin\theta_2`,
  String.raw`\theta_c = \arcsin\left(\frac{n_2}{n_1}\right)`,
  String.raw`\Delta = \frac{n_1^2 - n_2^2}{2n_1^2} \approx \frac{n_1 - n_2}{n_1}`,
  String.raw`NA = n_0 \sin\theta_a = \sqrt{n_1^2 - n_2^2} \approx n_1 \sqrt{2\Delta}`,
  String.raw`V = \frac{2\pi a}{\lambda} \cdot NA`,
  String.raw`M \approx \frac{V^2}{2}`,
  String.raw`\alpha_{\text{dB}} = 10 \log_{10}\left(\frac{P_{\text{in}}}{P_{\text{out}}}\right)`,
  String.raw`\alpha_{\text{total}} = (L \cdot \alpha_{\text{fiber}}) + (N_c \cdot \alpha_c) + (N_s \cdot \alpha_s) + \alpha_{\text{splitter}} + M_s`,
  String.raw`P_{\text{rx}} = P_{\text{tx}} - \alpha_{\text{total}}`,
];
// Delimiters in separate Word paragraphs and tokens split across runs.
export const formattingPreview = build(
  p(run('Rumus serat optik')) + expressions.map((expression, i) =>
    p(run(`${i + 1}. Persamaan`), i === 5 ? '<w:pageBreakBefore/>' : '') +
    p(run('$$')) + p(run(expression.slice(0, 4)) + run(expression.slice(4))) + p(run('$$')) +
    p(run('Keterangan: ') + latexToOmml(String.raw`n_1 > n_2`) + run(' merupakan syarat pemantulan.')),
  ).join(''),
);
assert.equal(math(formattingPreview).length, 20);
assert.equal(math(formattingPreview).filter(run => run.display).length, 10);
assert.ok(!all(formattingPreview).some(block => block.text.includes('$$')));
assert.ok(math(formattingPreview).some(run => run.math.includes('<mfrac>')));
assert.ok(math(formattingPreview).some(run => run.math.includes('<msqrt>')));

const mixed = build(p(run('Before ') + latexToOmml('a^2') + '<w:r><w:br w:type="page"/></w:r>' + run('After ') + latexToOmml('b_1')));
assert.equal(mixed.pages.length, 2);
assert.equal(mixed.pages[0].blocks[0].text, 'Before');
assert.equal(mixed.pages[1].blocks[0].text, 'After');
assert.equal(math(mixed).length, 2, 'Math is neither duplicated nor flattened across page breaks');
assert.ok(mixed.pages[0].blocks[0].runs.some(run => run.math?.includes('<msup>')));
assert.ok(mixed.pages[1].blocks[0].runs.some(run => run.math?.includes('<msub>')));

const onlyMath = build(p(latexToOmml(String.raw`\frac{c}{v}`, true)));
assert.equal(onlyMath.pages.length, 1);
assert.equal(math(onlyMath).length, 1);
const splitRun = build(p(run('Value $') + run('n_1') + run('$ then $$ ') + run(String.raw`\frac{c}{v}`) + run(' $$ end')));
assert.equal(math(splitRun).length, 2);
assert.equal(all(splitRun)[0].text, 'Value  then  end');

const coverAndBody = build(
  p(run('Cover title'), '<w:jc w:val="left"/><w:ind w:left="720" w:firstLine="360"/>') +
  p(run('Cover member'), '<w:jc w:val="right"/><w:ind w:left="720" w:hanging="360"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr>') +
  p('', '<w:pageBreakBefore/>') +
  p(run('BAB I PENDAHULUAN')) +
  p(run('Body paragraph')),
  new Map(),
  { formatted: true, formatOptions: { cover: true } },
);
const coverBlocks = all(coverAndBody);
assert.deepEqual(coverBlocks.slice(0, 2).map(block => block.alignment), ['center', 'center']);
assert.ok(coverBlocks.slice(0, 2).every(block => !block.firstLineIndent && !block.leftIndent && !block.hangingIndent));
assert.equal(coverBlocks[1].numberMarker, null, 'Cover list markers do not shift centered member rows');
assert.equal(coverBlocks[1].hasNumbering, false, 'Cover members do not inherit a numbered-list layout');
assert.notEqual(coverBlocks[2].alignment, 'center', 'Content after the cover page break is not treated as cover');

const coverWithoutBreak = build(
  p(run('Cover title'), '<w:jc w:val="left"/><w:ind w:left="720" w:firstLine="360"/>') +
  p(run('Cover member'), '<w:jc w:val="right"/><w:ind w:left="720" w:hanging="360"/>') +
  p(run('KATA PENGANTAR')) +
  p(run('Preface body')) +
  p(run('BAB I PENDAHULUAN')),
  new Map(),
  { formatted: true, formatOptions: { cover: true } },
);
const noBreakBlocks = all(coverWithoutBreak);
assert.deepEqual(noBreakBlocks.slice(0, 2).map(block => block.alignment), ['center', 'center']);
assert.ok(noBreakBlocks.slice(0, 2).every(block => block.isCover && !block.firstLineIndent && !block.leftIndent && !block.hangingIndent));
assert.ok(noBreakBlocks.slice(2).every(block => !block.isCover), 'Cover detection stops at Kata Pengantar without requiring a page break');

const tocOnlyFrontMatter = build(
  p(run('Cover title')) + p(run('Cover member')) + p(run('DAFTAR ISI')) + p(run('BAB I PENDAHULUAN')),
  new Map(),
  { formatted: true, formatOptions: { cover: true } },
);
assert.ok(all(tocOnlyFrontMatter).slice(0, 2).every(block => block.isCover && block.alignment === 'center'));
assert.ok(all(tocOnlyFrontMatter).slice(2).every(block => !block.isCover), 'Cover detection stops at Daftar Isi if there is no preface');

const styles = parseStyles('<w:styles><w:style w:type="paragraph" w:styleId="Break"><w:pPr><w:pageBreakBefore/></w:pPr></w:style></w:styles>');
const breaks = build(p(run('One')) + p(run('Two'), '<w:pStyle w:val="Break"/>') + p(run('Three'), '<w:pageBreakBefore w:val="0"/>') + p('', '<w:sectPr><w:type w:val="nextPage"/></w:sectPr>') + p(run('Four')), styles);
assert.deepEqual(breaks.pages.map(page => page.blocks.map(block => block.text)), [['One'], ['Two', 'Three'], ['Four']]);
const rendered = p(run('One') + '<w:r><w:lastRenderedPageBreak/></w:r>' + run('Two'));
assert.equal(build(rendered, new Map(), { useRenderedBreaks: true }).pages.length, 2);
assert.equal(build(rendered).pages.length, 1, 'Processed preview ignores stale Word layout traces');
const incomplete = build(p(run('$$')) + p(run('Unclosed equation')));
assert.ok(all(incomplete).some(block => block.text.includes('$$')), 'Unclosed delimiters preserve source text');
console.log('PASS: Formatting preview equations, split LaTeX runs/paragraphs, OMML, explicit/inherited/section/rendered breaks, and disabled breaks.');
