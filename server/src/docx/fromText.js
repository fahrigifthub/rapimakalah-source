import JSZip from 'jszip';
import { escapeXml } from './xml.js';
import { latexToOmml, splitMath } from './omml.js';

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const FONT = 'Times New Roman';

/** `**bold**`, `*italic*` / `_italic_` and plain text -> runs. */
function styledRuns(text, base = '') {
  const runs = [];
  const re = /\*\*(.+?)\*\*(?!\*)|__([^_]+)__|\*([^*\s][^*]*?)\*|(?<![\w])_([^_]+)_(?![\w])/g;
  let last = 0;
  let m;
  const push = (t, props = '') => {
    if (!t) return;
    t = t.replace(/`([^`]+)`/g, '$1');
    runs.push(`<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ''}<w:t xml:space="preserve">${escapeXml(t)}</w:t></w:r>`);
  };
  while ((m = re.exec(text))) {
    push(text.slice(last, m.index), base);
    if (m[1] !== undefined || m[2] !== undefined) {
      const inner = m[1] ?? m[2];
      if (inner.includes('*')) runs.push(styledRuns(inner, `${base}<w:b/><w:bCs/>`));
      else push(inner, `${base}<w:b/><w:bCs/>`);
    } else push(m[3] ?? m[4], `${base}<w:i/><w:iCs/>`);
    last = m.index + m[0].length;
  }
  push(text.slice(last), base);
  return runs.join('');
}
const paragraph = (inner, ppr = '') => `<w:p>${ppr ? `<w:pPr>${ppr}</w:pPr>` : ''}${inner}</w:p>`;

function inlineRuns(text, base = '') {
  return splitMath(text)
    .map((part) => {
      if (part.type === 'text') return styledRuns(part.value, base);
      return latexToOmml(part.value, part.type === 'display');
    })
    .join('');
}
function stripMarkdown(text) {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/__([^_]+)__/g, '$1').replace(/^[*_]+|[*_]+$/g, '').trim();
}

/**
 * Turn pasted text (plain or Markdown, e.g. from ChatGPT) into block descriptors.
 */
export function parseText(raw) {
  const lines = String(raw).replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let buffer = [];
  const flush = () => {
    if (!buffer.length) return;
    blocks.push({ type: 'p', text: buffer.join(' ').replace(/\s+/g, ' ').trim() });
    buffer = [];
  };
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].replace(/\s+$/, '');
    const trimmed = line.trim();
    if (!trimmed) { flush(); continue; }
    if (trimmed === '$$') {
      flush();
      const expression = [];
      while (i + 1 < lines.length && lines[i + 1].trim() !== '$$') expression.push(lines[++i].trim());
      if (i + 1 < lines.length) i += 1;
      blocks.push({ type: 'p', text: `$$${expression.join(' ')}$$` });
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,}|={3,})$/.test(trimmed)) {
      flush();
      blocks.push({ type: 'rule' });
      continue;
    }
    const nextLine = () => { let j = i + 1; while (j < lines.length && !lines[j].trim()) j += 1; return j < lines.length ? lines[j].trim() : ''; };
    const plainTitle = /^(KATA PENGANTAR|DAFTAR ISI|DAFTAR PUSTAKA|DAFTAR TABEL|DAFTAR GAMBAR|ABSTRAK|LAMPIRAN)$/i.test(trimmed) || /^BAB\s+[IVXL\d]+\b/i.test(trimmed);
    if (plainTitle) {
      flush();
      let text = trimmed;
      const nl = nextLine();
      if (/^BAB\s+[IVXL\d]+$/i.test(trimmed) && nl && nl === nl.toUpperCase() && nl.length < 80 && !/^BAB\b|^\d/.test(nl)) {
        while (i + 1 < lines.length && !lines[i + 1].trim()) i += 1;
        text = `${trimmed} ${nl}`;
        i += 1;
      }
      blocks.push({ type: 'h', level: 1, text });
      continue;
    }
    const decimal = /^(\d+(?:\.\d+)+)\.?\s+(\S.{1,100})$/.exec(trimmed);
    if (decimal && !/[.:;,]$/.test(trimmed)) {
      flush();
      blocks.push({ type: 'h', level: Math.min(decimal[1].split('.').length, 3), text: trimmed });
      continue;
    }
    const topNum = /^(\d+)\.\s+(\S.{1,80})$/.exec(trimmed);
    if (topNum && !/[.:;,?]$/.test(trimmed) && new RegExp(`^${topNum[1]}\\.1\\s`).test(nextLine())) {
      flush();
      blocks.push({ type: 'h', level: 1, text: trimmed });
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flush();
      let htext = stripMarkdown(heading[2]);
      if (/^BAB\s+[IVXL\d]+$/i.test(htext)) {
        const nl = nextLine().replace(/^#+\s*/, '');
        if (nl && nl === nl.toUpperCase() && nl.length < 80 && !/^BAB\b|^\d|^-{3,}$/.test(nl)) {
          while (i + 1 < lines.length && !lines[i + 1].trim()) i += 1;
          htext = `${htext} ${stripMarkdown(nl)}`;
          i += 1;
        }
      }
      const dec = /^(\d+(?:\.\d+)+)\.?\s/.exec(htext);
      const lvl = /^(BAB\s+[IVXL\d]+\b|KATA PENGANTAR|DAFTAR\s|ABSTRAK|LAMPIRAN)/i.test(htext) ? 1 : dec ? Math.min(dec[1].split('.').length, 3) : Math.min(heading[1].length, 3);
      blocks.push({ type: 'h', level: lvl, text: htext });
      continue;
    }
    const bullet = /^[-*+•]\s+(.*)$/.exec(trimmed);
    if (bullet) {
      flush();
      blocks.push({ type: 'li', ordered: false, text: bullet[1] });
      continue;
    }
    const numbered = /^(\d+)[.)]\s+(.*)$/.exec(trimmed);
    if (numbered) {
      flush();
      const item = { type: 'li', ordered: true, start: Number(numbered[1]), text: numbered[2] };
      // "   Penjelasan" lines directly below an item belong to that item.
      while (i + 1 < lines.length && /^\s{2,}\S/.test(lines[i + 1]) && !/^\s*([-*+•]|\d+[.)])\s/.test(lines[i + 1])) {
        item.extra = [...(item.extra || []), lines[i + 1].trim()];
        i += 1;
      }
      blocks.push(item);
      continue;
    }
    // Markdown "two trailing spaces" or a single newline: keep as a soft line break.
    if (/ {2,}$/.test(lines[i]) && buffer.length === 0 && i + 1 < lines.length && lines[i + 1].trim()) {
      buffer.push(trimmed);
      continue;
    }
    buffer.push(trimmed);
    flush();
  }
  flush();
  // Title block before the first --- is a cover, not a heading (keeps it out of the TOC).
  const firstRule = blocks.findIndex((b) => b.type === 'rule');
  if (firstRule > 0 && blocks.slice(firstRule).some((b) => b.type === 'h')) {
    for (let k = 0; k < firstRule; k += 1) if (blocks[k].type === 'h') blocks[k] = { type: 'p', text: blocks[k].text };
  }
  // Title lines pasted straight above KATA PENGANTAR / DAFTAR ISI / BAB I are a cover: split them off.
  const SECTION = /^(?:#+\s*)?(?:\*\*)?(KATA PENGANTAR|DAFTAR ISI|ABSTRAK|BAB\s+(?:I|1)\b|1\.?\s+PENDAHULUAN)/i;
  const first = blocks.findIndex((b) => b.type !== 'rule' && SECTION.test(b.text || ''));
  if (first > 0 && !blocks.slice(0, first).some((b) => b.type === 'rule')) blocks.splice(first, 0, { type: 'rule' });
  // A pasted contents list is not body content or a second set of headings.
  const toc = blocks.findIndex(b => b.type === 'h' && /^DAFTAR ISI$/i.test(b.text));
  const chapter = blocks.findIndex((b, i) => i > toc && b.type === 'h' && /^BAB\s+(I|1)\b/i.test(b.text));
  if (toc >= 0 && chapter > toc) blocks.splice(toc + 1, chapter - toc - 1);
  const preface = blocks.findIndex(b => b.type === 'h' && /^KATA PENGANTAR$/i.test(b.text));
  if (preface > 0) for (let i = 0; i < preface; i += 1) if (blocks[i].type === 'h') blocks[i].type = 'p';
  return blocks;
}

function blocksToXml(blocks) {
  let numId = 0;
  let lastWasOrdered = false;
  let currentNum = null;
  const out = [];
  const numberings = []; // ordered lists each restart at 1
  for (const b of blocks) {
    if (b.type === 'li' && b.ordered) {
      if (!lastWasOrdered) {
        numId += 1;
        currentNum = numId + 1; // numId 1 is the bullet list
        numberings.push({ id: currentNum, start: b.start || 1 });
      }
      lastWasOrdered = true;
      const extra = (b.extra || []).map((t) => `<w:r><w:br/></w:r>${inlineRuns(t)}`).join('');
      const label = /:\s*$/.test(stripMarkdown(b.text));
      out.push(paragraph(`${inlineRuns(b.text)}${extra}`, `${label ? '<w:keepNext/>' : ''}<w:keepLines/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="${currentNum}"/></w:numPr>`));
      continue;
    }
    lastWasOrdered = false;
    if (b.type === 'li') {
      out.push(paragraph(inlineRuns(b.text), '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>'));
    } else if (b.type === 'h' && /^[A-Z]\.\s+\S/.test(b.text)) {
      out.push(paragraph(inlineRuns(b.text, '<w:b/><w:bCs/>')));
    } else if (b.type === 'h') {
      const level = Math.min(b.level, 3);
      const chapter = /^(BAB\s+[IVXL\d]+)\s*[:.\-–—]?\s+(\S.*)$/i.exec(b.text);
      const inner = chapter
        ? `${inlineRuns(chapter[1])}<w:r><w:br/></w:r>${inlineRuns(chapter[2])}`
        : inlineRuns(b.text);
      const isChapter = level === 1 && /^BAB\s+[IVXL\d]+/i.test(b.text);
      const sub = level >= 2 ? /^(\d+(?:\.\d+)+)\.?\s+(\S.*)$/.exec(b.text) : null;
      const depth = sub ? sub[1].split('.').length - 1 : 0;
      if (isChapter) {
        out.push(paragraph(inner, `<w:pStyle w:val="Heading1"/><w:pageBreakBefore/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="99"/></w:numPr>`));
      } else if (sub && depth >= 1 && depth <= 2) {
        out.push(paragraph(inlineRuns(sub[2]), `<w:pStyle w:val="Heading${level}"/><w:numPr><w:ilvl w:val="${depth}"/><w:numId w:val="99"/></w:numPr>`));
      } else {
        out.push(paragraph(inner, `<w:pStyle w:val="Heading${level}"/>${level === 1 ? '<w:pageBreakBefore/>' : ''}`));
      }
    } else if (b.type === 'rule') {
      out.push(
        '<w:p><w:r><w:pict><v:rect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" style="width:0;height:1.5pt" o:hralign="center" o:hrstd="t" o:hr="t" fillcolor="#a0a0a0" stroked="f"/></w:pict></w:r></w:p>',
      );
    } else {
      out.push(paragraph(inlineRuns(b.text), b.text.startsWith('$$') ? '<w:keepLines/>' : ''));
    }
  }
  return { body: out.join(''), numberings };
}

function numberingXml(orderedIds) {
  const bullet =
    '<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>';
  const decimal =
    '<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>';
  const lvl = (i, text, left, hanging, fmt = 'decimal') =>
    `<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/>${i === 0 ? '<w:suff w:val="nothing"/>' : '<w:suff w:val="tab"/>'}<w:lvlText w:val="${text}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${left}" w:hanging="${hanging}"/></w:pPr></w:lvl>`;
  const heading = `<w:abstractNum w:abstractNumId="2"><w:multiLevelType w:val="multilevel"/>${lvl(0, '', 0, 0, 'decimal')}${lvl(1, '%1.%2', 709, 709)}${lvl(2, '%1.%2.%3', 851, 851)}</w:abstractNum>`;
  const nums = ['<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>', '<w:num w:numId="99"><w:abstractNumId w:val="2"/></w:num>']
    .concat(orderedIds.map(({ id, start }) => `<w:num w:numId="${id}"><w:abstractNumId w:val="1"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="${start}"/></w:lvlOverride></w:num>`))
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="${W_NS}">${bullet}${decimal}${heading}${nums}</w:numbering>`;
}

function stylesXml() {
  const heading = (id, name, size, outline) =>
    `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="${outline}"/></w:pPr><w:rPr><w:b/><w:bCs/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr></w:style>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="${W_NS}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:eastAsia="${FONT}" w:cs="${FONT}"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="id-ID"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>${heading('Heading1', 'heading 1', 28, 0)}${heading('Heading2', 'heading 2', 26, 1)}${heading('Heading3', 'heading 3', 24, 2)}</w:styles>`;
}

/** Build a minimal, valid DOCX (Buffer) from pasted text / Markdown. */
export async function buildDocxFromText(raw) {
  const blocks = parseText(raw);
  if (!blocks.length) throw new Error('Teks kosong.');
  const { body, numberings } = blocksToXml(blocks);
  const zip = new JSZip();
  zip.file('rapimakalah/source.json', JSON.stringify({ type: 'pasted-text', version: 1 }));
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/></Types>',
  );
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  zip.file(
    'word/_rels/document.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/></Relationships>',
  );
  zip.file('word/styles.xml', stylesXml());
  zip.file('word/numbering.xml', numberingXml(numberings));
  zip.file('word/settings.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="${W_NS}"><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`);
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W_NS}" xmlns:r="${R_NS}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1701" w:right="1701" w:bottom="1701" w:left="2268" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`,
  );
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
