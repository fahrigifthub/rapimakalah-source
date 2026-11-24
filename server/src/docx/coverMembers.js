import { PAGE_DIMENSIONS_TWIPS } from './reader.js';
import { coverMemberParagraph } from './coverMemberParagraph.js';

/**
 * Tabel anggota cover dengan garis tersembunyi.
 *
 * Nama dan NIM diletakkan di dua kolom tetap supaya baris antaranggota tetap
 * sejajar saat daftar anggota bertambah. Semua border diset `nil` sehingga
 * tabel tidak terlihat sebagai tabel di Word — hanya teks yang rapi.
 *
 * `makeParagraph` disuntikkan dari frontmatter agar modul ini tidak membuat
 * impor melingkar, tetapi tetap memakai gaya paragraf yang sama dengan cover.
 */
export function buildCoverMembersTable(config, members, { line = 276, makeParagraph } = {}) {
  if (typeof makeParagraph !== 'function') {
    throw new TypeError('buildCoverMembersTable membutuhkan makeParagraph.');
  }

  const page = PAGE_DIMENSIONS_TWIPS[config.page.size] || PAGE_DIMENSIONS_TWIPS.A4;
  const pageWidth = config.page.orientation === 'landscape' ? page.height : page.width;
  const textWidth =
    pageWidth - Math.round(((config.page.margins.left + config.page.margins.right) / 2.54) * 1440);
  const tableWidth = Math.round(textWidth * 0.9);
  const nameWidth = Math.round(tableWidth / 2);
  const nimWidth = tableWidth - nameWidth;
  const columns = [nameWidth, nimWidth];

  const borders = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
    .map((edge) => `<w:${edge} w:val="nil"/>`)
    .join('');
  const cellBorders = ['top', 'left', 'bottom', 'right']
    .map((edge) => `<w:${edge} w:val="nil"/>`)
    .join('');
  const cellMargins = ['top', 'left', 'bottom', 'right']
    .map((edge) => `<w:${edge} w:w="0" w:type="dxa"/>`)
    .join('');

  const cell = (text, width, span = 1) => {
    // Urutan elemen tcPr mengikuti skema OOXML: tcW, gridSpan, tcBorders, vAlign.
    const spanXml = span > 1 ? `<w:gridSpan w:val="${span}"/>` : '';
    return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${spanXml}<w:tcBorders>${cellBorders}</w:tcBorders><w:vAlign w:val="center"/></w:tcPr>${coverMemberParagraph(
      config,
      String(text || '').replace(/\s+/g, ' ').trim(),
      { line, makeParagraph },
    )}</w:tc>`;
  };

  const hasAnyNim = members.some((member) => String(member?.nim || '').trim());
  const rows = members
    .map((member) => {
      const name = String(member?.name || '').trim();
      const nim = String(member?.nim || '').trim();
      const cells = hasAnyNim
        ? [cell(name, nameWidth), cell(nim, nimWidth)]
        : [cell(name, tableWidth, 2)];
      return `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cells.join('')}</w:tr>`;
    })
    .join('');

  return (
    `<w:tbl><w:tblPr>` +
    `<w:tblStyle w:val="TableNormal"/>` +
    `<w:tblW w:w="${tableWidth}" w:type="dxa"/><w:jc w:val="center"/>` +
    `<w:tblBorders>${borders}</w:tblBorders>` +
    `<w:tblLayout w:type="fixed"/>` +
    `<w:tblCellMar>${cellMargins}</w:tblCellMar>` +
    `<w:tblLook w:val="0000" w:firstRow="0" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="0"/>` +
    `<w:tblCaption w:val="RapiMakalah Cover Members"/>` +
    `</w:tblPr><w:tblGrid>${columns.map((width) => `<w:gridCol w:w="${width}"/>`).join('')}</w:tblGrid>${rows}</w:tbl>`
  );
}
