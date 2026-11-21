import { buildPreviewPages, parseNumbering } from './preview.js';
import { parseStyles } from './reader.js';
import { escapeXml } from './xml.js';

const PLACEHOLDER = /<w:p\b(?:(?!<\/w:p>)[\s\S])*?Daftar isi akan diperbarui(?:(?!<\/w:p>)[\s\S])*?<\/w:p>/;
const BARE_BAB = /^BAB\s+([IVXLCDM]+|\d+)\s*$/i;

function collectEntries(preview, depth, includeTocTitle = true) {
  const raw = [];
  for (const page of preview.pages) {
    if (!page.pageLabel) continue;
    for (const block of page.blocks) {
      const isTocTitle = /^daftar\s+isi$/i.test((block.text || '').trim());
      if (isTocTitle) {
        if (includeTocTitle) raw.push({ level: 1, text: 'DAFTAR ISI', page: page.pageLabel });
        continue;
      }
      if (!block.headingLevel || block.headingLevel > depth) continue;
      if (!includeTocTitle && /^daftar\s+isi$/i.test((block.text || '').trim())) continue;
      const text = `${block.numberMarker ? `${block.numberMarker} ` : ''}${block.text || ''}`.replace(/\s+/g, ' ').trim();
      if (!text) continue;
      raw.push({ level: block.headingLevel, text, page: page.pageLabel });
    }
  }
  // "BAB I" + "PENDAHULUAN" on two lines read as one entry.
  const entries = [];
  for (let i = 0; i < raw.length; i += 1) {
    const cur = raw[i];
    const next = raw[i + 1];
    if (cur.level === 1 && BARE_BAB.test(cur.text) && next && next.level === 1 && !BARE_BAB.test(next.text) && next.page === cur.page) {
      entries.push({ level: 1, text: `${cur.text} ${next.text}`, page: cur.page });
      i += 1;
    } else {
      entries.push(cur);
    }
  }
  return entries;
}

function buildTocXml(entries, { fontFamily, fontSize, tabPos, instruction, lineSpacing }) {
  const font = escapeXml(fontFamily);
  const sz = Math.round(fontSize * 2);
  const rpr = `<w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr>`;
  const run = (inner) => `<w:r>${rpr}${inner}</w:r>`;
  const line = Math.round((lineSpacing || 1.5) * 240);
  const list = entries.length ? entries : [{ level: 1, text: 'Belum ada heading yang terdeteksi', page: '' }];
  return list
    .map((e, i) => {
      const first = i === 0;
      const last = i === list.length - 1;
      const left = (e.level - 1) * 440;
      const bold = e.level === 1 ? '<w:b/><w:bCs/>' : '';
      const boldRpr = rpr.replace('</w:rPr>', `${bold}</w:rPr>`);
      const r = (inner) => `<w:r>${boldRpr}${inner}</w:r>`;
      return (
        `<w:p><w:pPr><w:pStyle w:val="TOC${Math.min(e.level, 3)}"/><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="${tabPos}"/></w:tabs>` +
        `<w:spacing w:before="0" w:after="0" w:line="${line}" w:lineRule="auto"/><w:ind w:left="${left}" w:right="0"/><w:jc w:val="left"/></w:pPr>` +
        (first ? `${run('<w:fldChar w:fldCharType="begin"/>')}${run(`<w:instrText xml:space="preserve">${instruction}</w:instrText>`)}${run('<w:fldChar w:fldCharType="separate"/>')}` : '') +
        r(`<w:t xml:space="preserve">${escapeXml(e.text)}</w:t>`) +
        r('<w:tab/>') +
        r(`<w:t>${escapeXml(String(e.page))}</w:t>`) +
        (last ? run('<w:fldChar w:fldCharType="end"/>') : '') +
        '</w:p>'
      );
    })
    .join('');
}

/**
 * Replace the placeholder TOC paragraph with real entries + page numbers.
 * Page numbers come from RapiMakalah's own pagination (an estimate); the field
 * stays a genuine TOC field, so Word can still refresh it.
 */
export function fillTableOfContents(documentXml, stylesXml, config, numberingXml = '') {
  const numbering = parseNumbering(numberingXml);
  const match = PLACEHOLDER.exec(documentXml);
  if (!match) return { documentXml, filled: false };
  const instrMatch = /<w:instrText[^>]*>([^<]*TOC[^<]*)<\/w:instrText>/.exec(match[0]);
  const depth = Math.min(5, Math.max(1, config.toc.depth || 3));
  const margins = config.page.margins;
  const widthCm = config.page.size === 'Letter' ? 21.59 : config.page.size === 'Legal' ? 21.59 : 21;
  const sectWidth = /<w:pgSz[^>]*w:w="(\d+)"/.exec(documentXml);
  const pageWidthTw = sectWidth ? Number(sectWidth[1]) : Math.round((widthCm / 2.54) * 1440);
  const tabPos = Math.max(2000, pageWidthTw - Math.round(((margins.left + margins.right) / 2.54) * 1440));
  const opts = {
    fontFamily: config.typography.fontFamily,
    fontSize: config.typography.fontSize,
    lineSpacing: config.typography.lineSpacing,
    tabPos,
    instruction: instrMatch ? instrMatch[1] : ` TOC \\o "1-${depth}" \\h \\z \\u `,
  };
  const styles = parseStyles(stylesXml);
  const build = (xml, entries) => xml.replace(PLACEHOLDER, () => buildTocXml(entries, opts));

  // Pass 1 reserves the right amount of space; pass 2 reads the final pages.
  const first = collectEntries(buildPreviewPages(documentXml, styles, config, {}, numbering), depth, config.toc?.includeTocTitle !== false);
  const pass1 = build(documentXml, first.map((e) => ({ ...e, page: '0' })));
  const second = collectEntries(buildPreviewPages(pass1, styles, config, {}, numbering), depth, config.toc?.includeTocTitle !== false);
  return { documentXml: build(documentXml, second), filled: true, entries: second.length };
}
