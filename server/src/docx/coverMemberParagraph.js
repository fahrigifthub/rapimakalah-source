/**
 * Paragraf standar untuk sel nama/NIM di cover.
 *
 * Khusus blok anggota, teks tidak ditebalkan agar sesuai permintaan cover.
 */
export function coverMemberParagraph(config, text, { line = 276, makeParagraph } = {}) {
  if (typeof makeParagraph !== 'function') {
    throw new TypeError('coverMemberParagraph membutuhkan makeParagraph.');
  }
  return makeParagraph(config, text, {
    align: 'center',
    bold: false,
    line,
    before: 0,
    after: 0,
  });
}
