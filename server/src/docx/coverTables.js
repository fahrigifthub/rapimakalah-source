import { getBodyStructure } from './reader.js';

const EDGES = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'];
const CELL_EDGES = ['top', 'left', 'bottom', 'right'];

/** Border XML yang tidak menampilkan garis apa pun. */
export function hiddenBorders(edges = EDGES) {
  return edges.map((edge) => `<w:${edge} w:val="nil"/>`).join('');
}
function stripCellBorders(cellXml) {
  const hidden = `<w:tcBorders>${hiddenBorders(CELL_EDGES)}</w:tcBorders>`;
  if (/<w:tcBorders\b[\s\S]*?<\/w:tcBorders>/.test(cellXml)) {
    return cellXml.replace(/<w:tcBorders\b[\s\S]*?<\/w:tcBorders>/, hidden);
  }
  // tcPr wajib dimulai dengan tcW bila ada; sisipkan setelah tcW/gridSpan.
  if (/<w:tcPr\b[^>]*>/.test(cellXml)) {
    return cellXml.replace(/(<w:tcPr\b[^>]*>[\s\S]*?(?:<w:gridSpan\b[^>]*\/>)?)/, `$1${hidden}`);
  }
  return cellXml.replace(/<w:tc\b([^>]*)>/, `<w:tc$1><w:tcPr>${hidden}</w:tcPr>`);
}

function hideTableBorders(tableXml) {
  const borderXml = `<w:tblBorders>${hiddenBorders()}</w:tblBorders>`;
  let xml = tableXml;
  if (/<w:tblBorders\b[\s\S]*?<\/w:tblBorders>/.test(xml)) {
    xml = xml.replace(/<w:tblBorders\b[\s\S]*?<\/w:tblBorders>/, borderXml);
  } else if (/<w:tblPr\b[^>]*>/.test(xml)) {
    xml = xml.replace(/(<w:tblPr\b[^>]*>)/, `$1${borderXml}`);
  }
  if (!/<w:tblStyle\b/.test(xml) && /<w:tblPr\b[^>]*>/.test(xml)) {
    xml = xml.replace(/(<w:tblPr\b[^>]*>)/, '$1<w:tblStyle w:val="TableNormal"/>');
  }
  return xml.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, stripCellBorders);
}

function rowTexts(rowXml) {
  return [...rowXml.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
}

/** Baris judul "Nama | NIM" tidak perlu ikut tampil di cover. */
function isHeaderRow(rowXml) {
  const cells = rowTexts(rowXml);
  if (cells.length < 2) return false;
  return /^(nama|name)$/i.test(cells[0]) && /^(nim|n\.i\.m\.?|nomor\s+induk)$/i.test(cells[1]);
}

function normalizeTable(tableXml) {
  let xml = hideTableBorders(tableXml);
  const firstRow = /<w:tr\b[\s\S]*?<\/w:tr>/.exec(xml);
  if (firstRow && isHeaderRow(firstRow[0])) {
    xml = xml.slice(0, firstRow.index) + xml.slice(firstRow.index + firstRow[0].length);
  }
  return xml;
}

/**
 * Rapikan tabel yang sudah ada di area cover.
 *
 * Dokumen lama atau tabel buatan pengguna sering menyisakan garis tabel yang
 * terlihat. Semua border di area cover disembunyikan, dan baris judul
 * "Nama | NIM" dibuang supaya yang tampil hanya daftar anggota.
 *
 * Hanya tabel di dalam cover yang disentuh; tabel isi makalah tidak berubah.
 */
export function normalizeCoverTables(documentXml, coverEndIndex) {
  if (!Number.isInteger(coverEndIndex) || coverEndIndex < 0) {
    return { documentXml, changed: false };
  }
  const structure = getBodyStructure(documentXml);
  const targets = structure.blocks.filter((block) => block.type === 'w:tbl' && block.index <= coverEndIndex);
  if (!targets.length) return { documentXml, changed: false };

  let inner = structure.bodyInner;
  let changed = false;
  for (const block of [...targets].reverse()) {
    const next = normalizeTable(block.xml);
    if (next === block.xml) continue;
    inner = inner.slice(0, block.start) + next + inner.slice(block.end);
    changed = true;
  }
  if (!changed) return { documentXml, changed: false };
  return {
    documentXml: documentXml.slice(0, structure.bodyRange.openEnd) + inner + documentXml.slice(structure.bodyRange.closeStart),
    changed: true,
  };
}

function memberLine(member) {
  const name = String(member?.name || '').replace(/\s+/g, ' ').trim();
  const nim = String(member?.nim || '').replace(/\s+/g, ' ').trim();
  return { name, nim, line: nim ? `${name} (${nim})` : name };
}

function normalizeLine(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

/**
 * Ganti baris anggota lama ("NAMA (NIM)") di cover dengan tabel dua kolom.
 *
 * Cover yang sudah ada tidak dibuat ulang, jadi tanpa langkah ini anggota
 * tetap tampil sebagai satu baris. Hanya paragraf yang teksnya persis sama
 * dengan data anggota yang diganti; isi cover lain dibiarkan.
 */
export function refreshCoverMembers(documentXml, coverEndIndex, members, tableXml) {
  if (!Number.isInteger(coverEndIndex) || coverEndIndex < 0) {
    return { documentXml, changed: false };
  }
  const wanted = (members || []).map(memberLine).filter((member) => member.name);
  if (!wanted.length) return { documentXml, changed: false };

  const structure = getBodyStructure(documentXml);
  const existingTables = structure.blocks.filter(
    (block) => block.type === 'w:tbl' && block.index <= coverEndIndex && /<w:tblCaption\b[^>]*w:val="RapiMakalah Cover Members"/.test(block.xml),
  );

  // Live preview memformat ulang dokumen asli yang sama berulang kali. Jika
  // cover sudah memiliki tabel anggota, ganti tabel itu agar tambah/hapus
  // anggota langsung tercermin; jangan berhenti pada daftar lama.
  if (existingTables.length) {
    let inner = structure.bodyInner;
    for (const [index, block] of [...existingTables].reverse().entries()) {
      const replacement = index === existingTables.length - 1 ? tableXml : '';
      inner = inner.slice(0, block.start) + replacement + inner.slice(block.end);
    }
    return {
      documentXml: documentXml.slice(0, structure.bodyRange.openEnd) + inner + documentXml.slice(structure.bodyRange.closeStart),
      changed: true,
    };
  }

  const lines = new Set(wanted.map((member) => member.line));
  const targets = structure.blocks.filter(
    (block) => block.type === 'w:p' && block.index <= coverEndIndex && lines.has(normalizeLine(block.data?.plainText)),
  );
  if (!targets.length) return { documentXml, changed: false };

  // Gabungkan paragraf anggota yang berurutan menjadi satu tabel.
  const groups = [];
  for (const block of targets) {
    const last = groups[groups.length - 1];
    if (last && block.index === last[last.length - 1].index + 1) last.push(block);
    else groups.push([block]);
  }

  let inner = structure.bodyInner;
  for (const group of groups.reverse()) {
    const first = group[0];
    const last = group[group.length - 1];
    inner = inner.slice(0, first.start) + tableXml + inner.slice(last.end);
  }
  return {
    documentXml: documentXml.slice(0, structure.bodyRange.openEnd) + inner + documentXml.slice(structure.bodyRange.closeStart),
    changed: true,
  };
}
