import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { formattingPreview } from '../../server/scripts/test-formatting-preview.js';

const tocFixture = {
  pageCount: 1,
  pages: [{ blocks: [
    { id: 'toc-title', blockIndex: 0, type: 'paragraph', text: 'DAFTAR ISI', alignment: 'center', runs: [{ text: 'DAFTAR ISI', bold: true }] },
    { id: 'toc-entry', blockIndex: 1, type: 'paragraph', text: 'DAFTAR ISI\tii', alignment: 'justify', firstLineIndent: 1.25, runs: [{ text: 'DAFTAR ISI' }, { text: '\t' }, { text: 'ii' }], tabs: [{ val: 'right', leader: 'dot', pos: 14 }] },
  ] }],
  meta: { widthCm: 21, heightCm: 29.7, margins: { top: 3, bottom: 3, left: 4, right: 3 }, fontFamily: 'Times New Roman', fontSize: 12, lineSpacing: 1.5 },
};
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const server = await createServer({ server: { port: 0, host: '127.0.0.1' } });
await server.listen();
const browser = await chromium.launch({ executablePath: process.argv[3], headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/scripts/formatting-preview-browser.html`);
  await page.waitForFunction(() => Boolean(window.showPreview));
  await page.evaluate(preview => window.showPreview(preview), formattingPreview);
  await page.waitForFunction(() => document.querySelectorAll('math').length === 20);
  assert.equal(await page.locator('math[display="block"]').count(), 10);
  assert.equal(await page.locator('.docx-preview').count(), formattingPreview.pageCount);
  assert.ok(!(await page.locator('#root').innerText()).includes('$$'));
  const fractions = await page.locator('mfrac').evaluateAll(nodes => nodes.map(node => {
    const numerator = node.children[0].getBoundingClientRect();
    const denominator = node.children[1].getBoundingClientRect();
    return numerator.bottom <= denominator.top;
  }));
  assert.ok(fractions.length && fractions.every(Boolean), 'Fractions render vertically as MathML');
  const clipped = await page.locator('.docx-preview').evaluateAll(pages => pages.flatMap(page => [...page.children].filter(block => block.getBoundingClientRect().bottom > page.getBoundingClientRect().bottom + 1).map(block => block.textContent)));
  assert.deepEqual(clipped, [], 'Page content is not clipped');
  await page.screenshot({ path: process.argv[4], fullPage: true });
  await page.evaluate(preview => window.showPreview(preview), tocFixture);
  await page.waitForFunction(() => document.querySelectorAll('.docx-preview').length === 1);
  const tocSpacing = await page.locator('.docx-preview [data-block] .flex.items-baseline').evaluateAll(rows => rows.map(row => {
    const [title, leader, number] = [...row.children].map(node => node.getBoundingClientRect());
    const range = document.createRange();
    range.selectNodeContents(row.children[2]);
    const numberText = range.getBoundingClientRect();
    return { titleLeaderGap: leader.left - title.right, leaderNumberGap: numberText.left - leader.right, height: leader.height, dots: row.children[1].textContent, margin: getComputedStyle(row.children[1]).marginLeft };
  }));
  assert.equal(tocSpacing.length, 1);
  assert.ok(Math.abs(tocSpacing[0].titleLeaderGap) < 1, JSON.stringify(tocSpacing[0]));
  assert.ok(Math.abs(tocSpacing[0].leaderNumberGap) < 1, JSON.stringify(tocSpacing[0]));
  assert.equal(tocSpacing[0].margin, '0px');
  assert.match(tocSpacing[0].dots, /^\.+$/, 'Visible dot glyphs fill the leader');
  assert.ok(tocSpacing[0].height > 0, 'Leader has a visible line box');
  assert.deepEqual(errors, []);
  console.log('PASS: Formatting preview renders MathML, page boundaries, and continuous TOC dotted leaders touching title and page number in Chrome.');
} finally {
  await browser.close();
  server.httpServer.closeAllConnections();
  await server.close();
}
