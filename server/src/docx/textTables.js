/**
 * Tabel Markdown dari teks tempelan ("| No. | Aspek | Keterangan |").
 * Modul ini mendeteksi tabel, membaca sel, lalu membangun XML tabel Word yang
 * rapi. Dipakai fromText.js agar baris pipe tidak lagi jatuh menjadi paragraf.
 */

const DELIMITER_CELL = /^:?-{2,}:?$/;
const MAX_COLUMNS = 12;
const MAX_ROWS = 500;
const DEFAULT_TEXT_WIDTH = 7937; // twips: A4 dikurangi margin 1701/2268

/** Pecah satu baris tabel menjadi sel; pipe yang di-escape (\\|) tetap teks. */
export function splitTableRow(line) {
  const source = String(line).trim();
  let parts = source.split(/(?<!\\)\|/);
  if (source.startsWith('|')) parts = parts.slice(1);
  if (source.endsWith('|') && !source.endsWith('\\|')) parts = parts.slice(0, -1);
  return parts.map((part) => part.replace(/\\\|/g, '|').trim());
}

function isDelimiterRow(line) {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => DELIMITER_CELL.test(cell));
}

function alignmentOf(cell) {
  if (/^:-+:$/.test(cell)) return 'center';
  if (/^-+:$/.test(cell)) return 'right';
  return 'left';
}

function normalizeRow(cells, columns) {
  const row = cells.slice(0, columns);
  while (row.length < columns) row.push('');
  if (cells.length > columns) {
    // Sel berlebih digabung ke kolom terakhir supaya isi tidak hilang.
    row[columns - 1] = [row[columns - 1], ...cells.slice(columns)].filter(Boolean).join(' | ');
  }
  return row;
}

/**
 * Baca tabel Markdown mulai baris `start`.
 * @returns {{ table: { header: string[], align: string[], rows: string[][] }, next: number } | null}
 */
export function readTextTable(lines, start) {
  const headerLine = lines[start];
  if (!headerLine || !headerLine.includes('|')) return null;
  const header = splitTableRow(headerLine);
  if (header.length < 2 || header.length > MAX_COLUMNS) return null;
  if (!header.some((cell) => cell.length > 0)) return null;

  const delimiterLine = lines[start + 1];
  if (!delimiterLine || !delimiterLine.includes('-') || !isDelimiterRow(delimiterLine)) return null;
  const delimiters = splitTableRow(delimiterLine);
  if (delimiters.length !== header.length) return null;

  const align = delimiters.map(alignmentOf);
  const rows = [];
  let i = start + 2;
  while (i < lines.length && rows.length < MAX_ROWS) {
    const line = lines[i];
    if (!line.trim() || !line.includes('|')) break;
    rows.push(normalizeRow(splitTableRow(line), header.length));
    i += 1;
  }
  // Baris kosong di ujung tabel tidak perlu ikut menjadi sel kosong.
  while (rows.length && rows.at(-1).every((cell) => !cell)) rows.pop();
  if (!rows.length) return null;

  return { table: { header, align, rows }, next: i };
}

/** Lebar kolom proporsional terhadap isi, dengan batas minimum yang nyaman. */
function columnWidths(table, textWidth) {
  const columns = table.header.length;
  const measured = (value) => String(value || '').replace(/[*_`]/g, '').length;
  const weights = Array.from({ length: columns }, (_, index) => {
    const cells = [table.header[index], ...table.rows.map((row) => row[index])];
    return Math.max(3, ...cells.map(measured)) + 2;
  });
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  const minimum = Math.round(textWidth * 0.08);
  const widths = weights.map((weight) => Math.max(minimum, Math.round((textWidth * weight) / total)));
  const widthSum = widths.reduce((sum, width) => sum + width, 0);
  const widest = widths.indexOf(Math.max(...widths));
  widths[widest] += textWidth - widthSum;
  if (widths[widest] < minimum) widths[widest] = minimum;
  return widths;
}

function cellAlignment(table, column, rowValue) {
  const header = String(table.header[column] || '').trim();
  if (/^no\.?$|^nomor$/i.test(header) && /^\d+\.?$/.test(String(rowValue || '').trim())) return 'center';
  return table.align?.[column] || 'left';
}

const BORDER = 'w:val="single" w:sz="4" w:space="0" w:color="000000"';

/**
 * Bangun satu <w:tbl> dari tabel hasil readTextTable.
 * `inlineRuns` disuplai fromText.js agar pemformatan bold/italic sel konsisten.
 */
export function textTableXml(table, { inlineRuns, textWidth = DEFAULT_TEXT_WIDTH } = {}) {
  if (typeof inlineRuns !== 'function') throw new Error('inlineRuns wajib diisi untuk membangun tabel.');
  const columns = table.header.length;
  const widths = columnWidths(table, textWidth);

  const cell = (value, column, isHeader) => {
    const align = isHeader ? 'center' : cellAlignment(table, column, value);
    const runs = inlineRuns(String(value || ''), isHeader ? '<w:b/><w:bCs/>' : '');
    return (
      `<w:tc><w:tcPr><w:tcW w:w="${widths[column]}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>` +
      `<w:p><w:pPr><w:spacing w:before="20" w:after="20" w:line="240" w:lineRule="auto"/><w:jc w:val="${align}"/></w:pPr>${runs}</w:p></w:tc>`
    );
  };

  const row = (cells, isHeader) =>
    `<w:tr><w:trPr>${isHeader ? '<w:tblHeader/>' : ''}<w:cantSplit/></w:trPr>` +
    cells.map((value, column) => cell(value, column, isHeader)).join('') +
    '</w:tr>';

  const grid = widths.map((width) => `<w:gridCol w:w="${width}"/>`).join('');
  const headerRow = row(table.header, true);
  const bodyRows = table.rows.map((cells) => row(normalizeRow(cells, columns), false)).join('');

  return (
    '<w:tbl><w:tblPr>' +
    '<w:tblCaption w:val="RapiMakalah Text Table"/><w:tblW w:w="5000" w:type="pct"/><w:jc w:val="center"/>' +
    `<w:tblBorders><w:top ${BORDER}/><w:left ${BORDER}/><w:bottom ${BORDER}/><w:right ${BORDER}/><w:insideH ${BORDER}/><w:insideV ${BORDER}/></w:tblBorders>` +
    '<w:tblLayout w:type="autofit"/>' +
    '<w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar>' +
    '</w:tblPr>' +
    `<w:tblGrid>${grid}</w:tblGrid>` +
    headerRow +
    bodyRows +
    '</w:tbl>'
  );
}
