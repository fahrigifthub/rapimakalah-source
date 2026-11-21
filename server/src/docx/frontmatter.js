import { escapeXml } from './xml.js';
import { PAGE_DIMENSIONS_TWIPS } from './reader.js';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export function indonesianDate(date = new Date()) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function fontProps(config, { bold = false, size, caps = false } = {}) {
  const family = escapeXml(config.typography.fontFamily);
  const half = Math.round((size || config.typography.fontSize) * 2);
  return `<w:rFonts w:ascii="${family}" w:hAnsi="${family}" w:eastAsia="${family}" w:cs="${family}"/>${bold ? '<w:b/><w:bCs/>' : ''}${caps ? '<w:caps/>' : ''}<w:sz w:val="${half}"/><w:szCs w:val="${half}"/>`;
}

/** Build one paragraph. `lines` > 1 are rendered as line breaks inside the paragraph. */
export function para(config, text, opts = {}) {
  const {
    align = 'left',
    bold = false,
    size,
    before = 0,
    after = 0,
    line = 360,
    firstLine = 0,
    left = 0,
    pageBreakBefore = false,
    pageBreakAfter = false,
    keepNext = false,
    outline = null,
    frame = false,
  } = opts;
  const rPr = fontProps(config, { bold, size });
  const ppr =
    (keepNext ? '<w:keepNext/>' : '') +
    (pageBreakBefore ? '<w:pageBreakBefore/>' : '') +
    (frame ? (typeof frame === 'string' ? frame : SIGNATURE_FRAME) : '') +
    `<w:spacing w:before="${before}" w:after="${after}" w:line="${line}" w:lineRule="auto"/>` +
    (firstLine || left ? `<w:ind${left ? ` w:left="${left}"` : ''}${firstLine ? ` w:firstLine="${firstLine}"` : ''}/>` : '') +
    `<w:jc w:val="${align === 'justify' ? 'both' : align}"/>` +
    (outline !== null ? `<w:outlineLvl w:val="${outline}"/>` : '') +
    `<w:rPr>${rPr}</w:rPr>`;
  const runs = String(text)
    .split('\n')
    .map((t, i) => `${i ? '<w:r><w:br/></w:r>' : ''}<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${escapeXml(t)}</w:t></w:r>`)
    .join('');
  const brk = pageBreakAfter ? `<w:r><w:br w:type="page"/></w:r>` : '';
  return `<w:p><w:pPr>${ppr}</w:pPr>${runs}${brk}</w:p>`;
}

const CM = 567;

/** Centered inline picture for the cover; height = meta.logoSize cm (default 2.5), width capped at 2.5x height. */
export function logoPara(meta) {
  const size = Math.min(8, Math.max(1, Number(meta.logoSize) || 2.5));
  const maxH = size * 360000;
  const maxW = Math.min(10, size * 2.5) * 360000;
  const ratio = (meta.logoWidth || 1) / (meta.logoHeight || 1);
  let h = maxH;
  let w = Math.round(h * ratio);
  if (w > maxW) { w = maxW; h = Math.round(w / ratio); }
  const drawing = `<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${w}" cy="${h}"/><wp:docPr id="9001" name="Logo cover" descr="Logo"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="9001" name="logo"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${meta.logoRid}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`;
  return `<w:p><w:pPr><w:keepNext/><w:spacing w:before="360" w:after="240" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/></w:pPr><w:r>${drawing}</w:r></w:p>`;
}

function coverSettings(config) {
  const c = config.cover || {};
  return {
    titleSize: Number(c.titleSize) || 16,
    institutionSize: Number(c.institutionSize) || Number(c.titleSize) || 16,
    showDepartment: c.showDepartment !== false,
    institutionAtBottom: c.institutionAtBottom !== false,
  };
}

function coverFit(config, meta, memberCount) {
  const cs = coverSettings(config);
  const page = PAGE_DIMENSIONS_TWIPS[config.page.size] || PAGE_DIMENSIONS_TWIPS.A4;
  const pageH = config.page.orientation === 'landscape' ? page.width : page.height;
  const avail = pageH - Math.round(((config.page.margins.top + config.page.margins.bottom) / 2.54) * 1440);
  const fs = config.typography.fontSize;
  const h = (pt) => pt * 20 * 1.17;
  const titleLines = Math.max(1, Math.ceil(String(meta.title || 'JUDUL MAKALAH').length / 32));
  const logo = meta.logoRid ? (Math.min(8, Math.max(1, Number(meta.logoSize) || 2.5)) * 567) : h(fs) * 1.2;
  const hasDepartment = cs.showDepartment && String(meta.department || '').trim();
  const text = h(cs.titleSize) * (1 + titleLines) + h(fs) * (1 + 1 + memberCount) + logo + h(cs.institutionSize) * (hasDepartment ? 5 : 4) + h(fs) * 2;
  const spacing = 120 + 360 + 60 + 240 + (meta.logoRid ? 600 : 960) + 120 + 480;
  return Math.min(1, Math.max(0.15, (avail - text - 600) / spacing));
}

export function buildCoverXml(config, meta = {}, { pageBreakAfter = true } = {}) {
  const ph = (value, hint) => (value && String(value).trim() ? String(value).trim() : `[${hint}]`);
  const listed = (meta.members || [])
    .filter((m) => m && String(m.name || '').trim())
    .map((m) => ({ name: m.name.trim(), nim: String(m.nim || '').trim() }));
  const members = listed.length
    ? listed
    : String(meta.author || '')
        .split(/\n|;/)
        .map((m) => m.trim())
        .filter(Boolean)
         .map((m, i, arr) => ({ name: m, nim: arr.length === 1 ? String(meta.nim || '').trim() : '' }));
  const memberLines = members.length ? members : Array.from({ length: 4 }, (_, i) => ({ name: `[Nama Anggota ${i + 1}]`, nim: '[NIM]' }));
  const cs = coverSettings(config);
  const k = coverFit(config, meta, memberLines.length);
  const sp = (v) => Math.round(v * k);
  const c = { align: 'center', line: k < 0.5 ? 240 : 276 };
  const parts = [];
  parts.push(para(config, ph(meta.documentType, 'JENIS DOKUMEN').toUpperCase(), { ...c, bold: true, size: cs.titleSize, after: sp(120) }));
  parts.push(para(config, ph(meta.title, 'JUDUL MAKALAH').toUpperCase(), { ...c, bold: true, size: cs.titleSize, after: sp(360) }));
  parts.push(para(config, 'Disusun guna memenuhi tugas mata kuliah', { ...c, after: sp(60) }));
  parts.push(para(config, ph(meta.course, 'Nama mata kuliah').toUpperCase(), { ...c, bold: true, after: sp(240) }));
  parts.push(para(config, 'Dosen Pengampu:', { ...c }));
  parts.push(para(config, ph(meta.lecturer, 'Nama dosen pengampu'), { ...c, after: meta.logoRid ? 0 : sp(360) }));
  parts.push(meta.logoRid ? logoPara(meta) : para(config, '[Tempel logo / foto di sini]', { ...c, before: sp(480), after: sp(480) }));
  parts.push(para(config, 'Disusun oleh:', { ...c, after: sp(120) }));
  memberLines.forEach(member => parts.push(para(config, member.nim ? `${member.name} (${member.nim})` : member.name, { ...c, bold: true })));
  const inst = [
    ph(meta.program, 'PROGRAM STUDI').toUpperCase(),
    ...(cs.showDepartment && String(meta.department || '').trim() ? [String(meta.department).trim().toUpperCase()] : []),
    ph(meta.faculty, 'FAKULTAS').toUpperCase(),
    ph(meta.institution, 'UNIVERSITAS').toUpperCase(),
    ph(meta.year || new Date().getFullYear(), 'TAHUN'),
  ];
  const page = PAGE_DIMENSIONS_TWIPS[config.page.size] || PAGE_DIMENSIONS_TWIPS.A4;
  const pageW = config.page.orientation === 'landscape' ? page.height : page.width;
  const textW = pageW - Math.round(((config.page.margins.left + config.page.margins.right) / 2.54) * 1440);
  const frame = `<w:framePr w:w="${textW}" w:hSpace="0" w:wrap="notBeside" w:vAnchor="margin" w:hAnchor="margin" w:xAlign="center" w:yAlign="bottom"/>`;
  inst.forEach((line, i) => parts.push(para(config, line, { ...c, bold: true, size: cs.institutionSize, ...(cs.institutionAtBottom ? { frame } : { before: i === 0 ? sp(480) : 0 }) })));
  if (pageBreakAfter) {
    parts.push('<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="2"/></w:rPr><w:br w:type="page"/></w:r></w:p>');
  }
  return parts.join('');
}

/** Fixed, centered columns align members without printing table borders. */
export function buildMembersTable(config, members, { line = 276 } = {}) {
  const page = PAGE_DIMENSIONS_TWIPS[config.page.size] || PAGE_DIMENSIONS_TWIPS.A4;
  const pageW = config.page.orientation === 'landscape' ? page.height : page.width;
  const textW = pageW - Math.round((config.page.margins.left + config.page.margins.right) / 2.54 * 1440);
  const width = Math.round(textW * 0.9);
  const columns = [Math.round(width / 2), width - Math.round(width / 2)];
  const borders = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(edge => `<w:${edge} w:val="nil"/>`).join('');
  const rows = members.map(member => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${[member.name, member.nim].map((text, i) => `<w:tc><w:tcPr><w:tcW w:w="${columns[i]}" w:type="dxa"/><w:noWrap/><w:tcFitText/><w:vAlign w:val="center"/></w:tcPr>${para(config, String(text || '').replace(/\s+/g, ' ').trim(), { align: 'center', line, keepNext: true })}</w:tc>`).join('')}</w:tr>`).join('');
  return `<w:tbl><w:tblPr><w:tblCaption w:val="RapiMakalah Cover Members"/><w:tblW w:w="${width}" w:type="dxa"/><w:jc w:val="center"/><w:tblBorders>${borders}</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${columns.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${rows}</w:tbl>`;
}
/** Signature block pinned to the bottom-right of the page (adjacent paragraphs with the same frame merge). */
export const SIGNATURE_FRAME = '<w:framePr w:w="4536" w:hSpace="0" w:wrap="notBeside" w:vAnchor="margin" w:hAnchor="margin" w:xAlign="right" w:yAlign="bottom"/>';

export function buildPrefaceXml(config, meta = {}) {
  const topic = meta.title ? `\u201c${meta.title}\u201d` : 'makalah ini';
  const city = meta.city || 'Tempat';
  const date = meta.date || indonesianDate();
  const body = (text) => para(config, text, { align: 'justify', firstLine: Math.round(config.typography.firstLineIndent * CM), line: Math.round(config.typography.lineSpacing * 240) });
  const sigLeft = Math.round(8 * CM);
  const sig = (text, o = {}) => para(config, text, { align: 'right', line: 360, frame: true, ...o });
  return [
    para(config, 'KATA PENGANTAR', { align: 'center', bold: true, size: config.headings.chapter.fontSize, pageBreakBefore: true, after: 240, line: 360, outline: 0 }),
    body('Puji syukur penulis panjatkan ke hadirat Tuhan Yang Maha Esa atas segala rahmat dan karunia-Nya sehingga penulis dapat menyelesaikan penyusunan ' + topic + ' dengan baik dan tepat waktu.'),
    body('Penulis menyampaikan terima kasih kepada semua pihak yang telah membantu dan memberikan dukungan dalam proses penyusunan karya ini. Penulis menyadari bahwa karya ini masih jauh dari sempurna, sehingga kritik dan saran yang membangun sangat penulis harapkan demi perbaikan di masa mendatang.'),
    body('Semoga karya ini dapat memberikan manfaat dan menambah wawasan bagi para pembaca.'),
    sig(`${city}, ${date}`, { before: 480, after: 1200 }),
    sig(meta.author || 'Nama Penulis', { bold: true }),
  ].join('');
}

const SIGNATURE_LINE = /^(penulis|penyusun|hormat kami|kelompok\s*\d*)[,.]?$/i;
const PLACE_DATE_LINE = /^[A-Z][\p{L}\s.]{1,30},\s*(?:\d{1,2}\s+)?[A-Za-z]+\s+\d{4}$/u;

/**
 * Edits (by block index) for an existing "KATA PENGANTAR" section: centered bold
 * title, justified body, and place/date + signature lines aligned in a right-hand block.
 */
export function classifyPrefaceBlocks(blocks, headingBlockIndex, endBlockIndex) {
  const roles = new Map();
  roles.set(headingBlockIndex, 'title');
  for (let i = headingBlockIndex + 1; i < endBlockIndex; i += 1) {
    const b = blocks[i];
    if (!b || b.type !== 'w:p' || !b.data) continue;
    const t = b.data.plainText;
    if (!t) continue;
    if (PLACE_DATE_LINE.test(t)) roles.set(i, 'placeDate');
    else if (SIGNATURE_LINE.test(t)) roles.set(i, 'signatureLabel');
  }
  // The name line is the last non-empty paragraph after the signature label.
  const labelIdx = [...roles].find(([, r]) => r === 'signatureLabel')?.[0];
  if (labelIdx !== undefined) {
    for (let i = endBlockIndex - 1; i > labelIdx; i -= 1) {
      const b = blocks[i];
      if (b?.type === 'w:p' && b.data?.plainText) {
        roles.set(i, 'signatureName');
        break;
      }
    }
  }
  return roles;
}
