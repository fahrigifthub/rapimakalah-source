import { detectHeadings, getBodyStructure, getSectionProperties, parseParagraph, parseStyles, readDocxBuffer } from './reader.js';
import { isLetteredLabel, bodyAlignment, prefaceRolesFor } from './paragraphRules.js';

const ALIGN_LABEL = { both: 'justify', justify: 'justify', left: 'kiri', right: 'kanan', center: 'tengah', null: 'kiri (default)' };
const toCm = (twips) => Number(((twips || 0) / 1440) * 2.54).toFixed(2);
const toPt = (twips) => Number(((twips || 0) / 20).toFixed(1));
const near = (a, b, tolerance) => Math.abs(Number(a) - Number(b)) <= tolerance;

function snippet(text, max = 90) {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function issueBase(code, category, severity, title, message, recommendation, extra = {}) {
  return { code, category, severity, title, message, recommendation, ...extra };
}

function getCoverEnd(blocks, headings) {
  const bodyStart =
    headings.find((h) => h.level === 1 && /^BAB\b/i.test(h.text))?.blockIndex ??
    headings.find((h) => h.level === 1)?.blockIndex ??
    null;
  if (bodyStart === null) return null;
  for (const block of blocks) {
    if (block.index >= bodyStart) break;
    if (block.type !== 'w:p' || !block.data) continue;
    if (block.data.pageBreakBefore) return block.index > 0 ? block.index - 1 : null;
    if (block.data.sectionBreak || block.data.pageBreakCount > 0) return block.index;
  }
  return null;
}

function checkFonts(blocks, headings, config, coverEnd) {
  const expected = config.typography.fontFamily.toLowerCase();
  const offenders = [];
  const sizes = [];
  const headingBlocks = new Set(headings.map((h) => h.blockIndex));
  let inspected = 0;
  for (const block of blocks) {
    if (block.type !== 'w:p' || !block.data?.plainText || headingBlocks.has(block.index)) continue;
    if (coverEnd !== null && block.index <= coverEnd) continue;
    inspected += 1;
    const fonts = [...new Set(block.data.runs.map((r) => r.font).filter(Boolean))];
    const sizeSet = [...new Set(block.data.runs.map((r) => r.size).filter(Boolean))];
    if (fonts.some((f) => f.toLowerCase() !== expected)) {
      offenders.push({ blockIndex: block.index, text: block.data.plainText, found: fonts.join(', '), expected: config.typography.fontFamily });
    }
    if (sizes.length < 30) sizes.push(...sizeSet);
  }
  const issues = offenders.slice(0, 12).map((o) =>
    issueBase(
      'FONT_MISMATCH',
      'font',
      'warning',
      'Font tidak sesuai template',
      `Paragraf menggunakan font ${o.found}, sedangkan template menggunakan ${o.expected}.`,
      `Ubah font paragraf ini menjadi ${o.expected} melalui panel Formatting.`,
      { blockIndex: o.blockIndex, snippet: snippet(o.text), found: o.found, expected: o.expected },
    ),
  );
  if (offenders.length > 12) {
    issues.push(issueBase('FONT_MISMATCH_MORE', 'font', 'warning', 'Masih ada paragraf dengan font berbeda', `${offenders.length - 12} paragraf lain juga menggunakan font yang tidak sesuai.`, 'Jalankan formatting otomatis untuk menyelaraskan seluruh run teks.', {}));
  }
  const distinct = [...new Set(sizes)].sort((a, b) => a - b);
  return {
    key: 'font',
    label: 'Konsistensi font',
    status: offenders.length ? 'warning' : 'ok',
    summary: offenders.length
      ? `${offenders.length} dari ${inspected} paragraf memakai font di luar template.`
      : 'Semua run teks yang memiliki font eksplisit sesuai template.',
    issues,
    meta: { inspected, distinctSizes: distinct },
  };
}

function checkFontSizes(blocks, headings, config, coverEnd) {
  const expected = config.typography.fontSize;
  const offenders = [];
  const headingBlocks = new Set(headings.map((h) => h.blockIndex));
  for (const block of blocks) {
    if (block.type !== 'w:p' || !block.data?.plainText || headingBlocks.has(block.index)) continue;
    if (coverEnd !== null && block.index <= coverEnd) continue;
    const sizes = [...new Set(block.data.runs.map((r) => r.size).filter(Boolean))];
    if (!sizes.length) continue;
    const bodySizes = sizes.filter((s) => !near(s, expected, 0.5));
    if (bodySizes.length) {
      offenders.push({ blockIndex: block.index, text: block.data.plainText, found: sizes.join(', ') });
    }
  }
  const issues = offenders.slice(0, 12).map((o) =>
    issueBase(
      'SIZE_MISMATCH',
      'fontSize',
      'warning',
      'Ukuran huruf tidak konsisten',
      `Ditemukan ukuran ${o.found} pt pada paragraf yang seharusnya ${expected} pt.`,
      `Samakan ukuran teks menjadi ${expected} pt, kecuali judul bab yang boleh ${config.headings.chapter.fontSize} pt.`,
      { blockIndex: o.blockIndex, snippet: snippet(o.text), found: o.found, expected },
    ),
  );
  if (offenders.length > 12) {
    issues.push(issueBase('SIZE_MISMATCH_MORE', 'fontSize', 'warning', 'Ukuran huruf lain tidak sesuai', `${offenders.length - 12} paragraf lain memiliki ukuran berbeda.`, 'Gunakan formatting otomatis untuk menyamakan ukuran teks.', {}));
  }
  return {
    key: 'fontSize',
    label: 'Ukuran teks',
    status: offenders.length ? 'warning' : 'ok',
    summary: offenders.length ? `${offenders.length} paragraf memiliki ukuran teks berbeda.` : `Ukuran teks eksplisit sesuai ${expected} pt.`,
    issues,
  };
}

function bodyParagraphs(blocks, headings, coverEnd = null) {
  const headingIndexes = new Set(headings.map((h) => h.blockIndex));
  return blocks.filter(
    (b) =>
      b.type === 'w:p' &&
      b.data?.plainText &&
      !headingIndexes.has(b.index) &&
      !b.data.hasTable &&
      !b.data.hasTocField &&
      !/^TOC\d+$/i.test(b.data.styleId || '') &&
      (coverEnd === null || b.index > coverEnd),
  );
}

function checkSpacing(blocks, headings, config, coverEnd) {
  const expected = config.typography.lineSpacing;
  const offenders = [];
  const missing = [];
  for (const block of bodyParagraphs(blocks, headings, coverEnd)) {
    const p = block.data;
    if (p.lineSpacing === null || p.lineSpacing === undefined) {
      missing.push(block);
      continue;
    }
    if (!near(p.lineSpacing / 240, expected, 0.08)) {
      offenders.push({ blockIndex: block.index, text: p.plainText, found: Number((p.lineSpacing / 240).toFixed(2)) });
    }
  }
  const issues = offenders.slice(0, 10).map((o) =>
    issueBase(
      'SPACING_MISMATCH',
      'lineSpacing',
      'warning',
      'Spasi baris tidak sesuai',
      `Spasi ${o.found}× terdeteksi, template menggunakan ${expected}×.`,
      `Atur line spacing paragraf menjadi ${expected}.`,
      { blockIndex: o.blockIndex, snippet: snippet(o.text), found: o.found, expected },
    ),
  );
  if (missing.length) {
    issues.push(
      issueBase(
        'SPACING_INHERITED',
        'lineSpacing',
        'warning',
        'Spasi baris tidak eksplisit',
        `${missing.length} paragraf tidak memiliki pengaturan spasi eksplisit sehingga bergantung pada style.`,
        'Jalankan formatting untuk menetapkan spasi secara eksplisit agar konsisten di semua Word.',
        { blockIndex: missing[0].index, snippet: snippet(missing[0].data.plainText) },
      ),
    );
  }
  return {
    key: 'lineSpacing',
    label: 'Spasi baris',
    status: offenders.length ? 'warning' : missing.length ? 'warning' : 'ok',
    summary:
      offenders.length || missing.length
        ? `${offenders.length} paragraf tidak sesuai, ${missing.length} paragraf tanpa spasi eksplisit.`
        : `Spasi baris sesuai ${expected}×.`,
    issues,
  };
}

function checkIndent(blocks, headings, config, coverEnd) {
  const expectedTwips = Math.round(config.typography.firstLineIndent * 567);
  const prefaceRoles = prefaceRolesFor(blocks, new Set(headings.map(h => h.blockIndex)), coverEnd);
  const offenders = [];
  for (const block of bodyParagraphs(blocks, headings, coverEnd)) {
    const p = block.data;
    if (p.hasNumbering) continue;
    const signature = prefaceRoles.has(block.index);
    const hanging = isLetteredLabel(p) ? 425 : p.styleId === 'Bibliography' ? Math.round((config.bibliography?.hangingIndent ?? 1.27) / 2.54 * 1440) : null;
    const expected = hanging ?? (signature ? 0 : expectedTwips);
    const indent = hanging !== null ? p.hangingIndent ?? 0 : p.hangingIndent ? -p.hangingIndent : p.firstLineIndent ?? 0;
    if (!near(indent, expected, 60)) {
      offenders.push({ blockIndex: block.index, text: p.plainText, found: Number((indent / 567).toFixed(2)), expected: Number((expected / 567).toFixed(2)), hanging: hanging !== null });
    }
  }
  const issues = offenders.slice(0, 10).map((o) =>
    issueBase(
      'INDENT_MISMATCH',
      'indentation',
      'warning',
      o.hanging ? 'Indentasi gantung berbeda' : 'Indentasi baris pertama berbeda',
      `Indentasi ${o.found} cm, aturan bagian ini menggunakan ${o.expected} cm.`,
      `Atur ${o.hanging ? 'hanging indent' : 'first line indent'} menjadi ${o.expected} cm.`,
      { blockIndex: o.blockIndex, snippet: snippet(o.text), found: o.found, expected: o.expected },
    ),
  );
  return {
    key: 'indentation',
    label: 'Indentasi',
    status: offenders.length ? 'warning' : 'ok',
    summary: offenders.length ? `${offenders.length} paragraf memiliki indentasi berbeda.` : 'Indentasi paragraf sesuai template.',
    issues,
  };
}

function checkAlignment(blocks, headings, config, coverEnd) {
  const prefaceRoles = prefaceRolesFor(blocks, new Set(headings.map(h => h.blockIndex)), coverEnd);
  const offenders = [];
  for (const block of bodyParagraphs(blocks, headings, coverEnd)) {
    const expected = prefaceRoles.has(block.index) ? 'right' : isLetteredLabel(block.data) ? 'left' : block.data.styleId === 'Bibliography' ? (config.bibliography?.alignment === 'justify' ? 'both' : config.bibliography?.alignment || 'both') : bodyAlignment(block.xml, config.typography.alignment);
    const actual = block.data.alignment || 'left';
    if (actual !== expected) {
      offenders.push({ blockIndex: block.index, text: block.data.plainText, found: actual, expected });
    }
  }
  const issues = offenders.slice(0, 10).map((o) =>
    issueBase(
      'ALIGN_MISMATCH',
      'alignment',
      'warning',
      'Perataan paragraf tidak sesuai',
      `Paragraf menggunakan perataan ${ALIGN_LABEL[o.found] || o.found}, aturan bagian ini menggunakan ${ALIGN_LABEL[o.expected] || o.expected}.`,
      `Ubah perataan menjadi ${ALIGN_LABEL[o.expected] || o.expected}.`,
      { blockIndex: o.blockIndex, snippet: snippet(o.text), found: o.found, expected: o.expected },
    ),
  );
  return {
    key: 'alignment',
    label: 'Perataan',
    status: offenders.length ? 'warning' : 'ok',
    summary: offenders.length ? `${offenders.length} paragraf belum sesuai aturan perataan bagiannya.` : 'Perataan paragraf sesuai template dan fungsi bagiannya.',
    issues,
  };
}

function checkHeadings(blocks, headings, config) {
  const issues = [];
  if (!headings.length) {
    issues.push(
      issueBase(
        'NO_HEADINGS',
        'headings',
        'warning',
        'Heading tidak terdeteksi',
        'RapiMakalah tidak menemukan heading berdasarkan style Heading, outline level, atau pola "BAB"/penomoran subbab.',
        'Terapkan style Heading 1/2/3 pada judul bab dan subbab, atau awali judul bab dengan "BAB".',
        {},
      ),
    );
  }
  let hierarchyJumps = 0;
  let prevLevel = 0;
  const misformatted = [];
  for (const h of headings) {
    if (prevLevel && h.level > prevLevel + 1) hierarchyJumps += 1;
    prevLevel = h.level;
    const block = blocks[h.blockIndex];
    if (!block?.data) continue;
    const cfg = h.level === 1 ? config.headings.chapter : h.level === 2 ? config.headings.subheading : config.headings.subsubheading;
    const p = block.data;
    const boldOk = p.runs.some((r) => r.bold);
    const sizeOk = !p.runs.length || p.runs.some((r) => !r.size || near(r.size, cfg.fontSize, 0.5));
    const alignOk = !cfg.alignment || p.alignment === (cfg.alignment === 'justify' ? 'both' : cfg.alignment) || (!p.alignment && cfg.alignment === 'left');
    if (!boldOk || !sizeOk || !alignOk) {
      misformatted.push({ h, boldOk, sizeOk, alignOk });
    }
  }
  for (const m of misformatted.slice(0, 8)) {
    const cfg = m.h.level === 1 ? config.headings.chapter : m.h.level === 2 ? config.headings.subheading : config.headings.subsubheading;
    const reasons = [];
    if (!m.boldOk) reasons.push('belum tebal');
    if (!m.sizeOk) reasons.push(`ukuran bukan ${cfg.fontSize} pt`);
    if (!m.alignOk) reasons.push(`perataan bukan ${cfg.alignment}`);
    issues.push(
      issueBase(
        'HEADING_FORMAT',
        'headings',
        'warning',
        'Format heading belum sesuai',
        `"${snippet(m.h.text, 60)}" ${reasons.join(', ')}.`,
        'Jalankan perapian heading atau terapkan format heading dari panel Formatting.',
        { blockIndex: m.h.blockIndex, snippet: snippet(m.h.text) },
      ),
    );
  }
  if (hierarchyJumps) {
    issues.push(
      issueBase(
        'HEADING_HIERARCHY',
        'headings',
        'warning',
        'Hierarki heading melompat',
        `${hierarchyJumps} tempat melompati tingkat heading (mis. Heading 1 langsung ke Heading 3).`,
        'Gunakan tingkat heading berurutan agar daftar isi tersusun rapi.',
        {},
      ),
    );
  }
  return {
    key: 'headings',
    label: 'Heading',
    status: issues.length ? 'warning' : 'ok',
    summary: headings.length
      ? `${headings.length} heading terdeteksi; ${misformatted.length} perlu disesuaikan.`
      : 'Tidak ada heading yang dapat diidentifikasi.',
    issues,
    headings,
  };
}

function checkMargins(sections, config) {
  const issues = [];
  const expected = config.page.margins;
  sections.forEach((s, index) => {
    if (!s.margins) return;
    for (const side of ['top', 'right', 'bottom', 'left']) {
      const actualCm = Number(toCm(s.margins[side]));
      if (!near(actualCm, expected[side], 0.1)) {
        issues.push(
          issueBase(
            'MARGIN_MISMATCH',
            'margins',
            'warning',
            `Margin ${side} tidak sesuai`,
            `Section ${index + 1} menggunakan margin ${side} ${actualCm} cm, template ${expected[side]} cm.`,
            `Atur margin ${side} menjadi ${expected[side]} cm.`,
            { section: index + 1, found: actualCm, expected: expected[side] },
          ),
        );
      }
    }
  });
  return {
    key: 'margins',
    label: 'Margin & halaman',
    status: issues.length ? 'warning' : sections.length ? 'ok' : 'warning',
    summary: sections.length
      ? issues.length
        ? `${issues.length} pengaturan margin tidak sesuai template.`
        : 'Margin seluruh section sesuai template.'
      : 'Section properti tidak ditemukan.',
    issues,
  };
}

function checkBlankPages(blocks, coverEnd = null) {
  const issues = [];
  let previousBreakOnly = false;
  let emptyRun = 0;
  let emptyRunReported = false;
  for (const block of blocks) {
    if (block.type !== 'w:p' || !block.data) continue;
    if (coverEnd !== null && block.index <= coverEnd) continue;
    const p = block.data;
    const isEmpty = !p.plainText && p.hasImage === false;
    if (isEmpty) {
      emptyRun += 1;
      if (p.pageBreakCount > 0 || p.pageBreakBefore) {
        if (p.pageBreakCount > 1 || previousBreakOnly) {
          issues.push(
            issueBase(
              'BLANK_PAGE',
              'blankPages',
              'warning',
              'Potensi halaman kosong',
              'Terdapat page break beruntun pada paragraf kosong sehingga berpotensi menghasilkan halaman kosong.',
              'Hapus salah satu page break atau paragraf kosong di sekitar posisi tersebut.',
              { blockIndex: block.index },
            ),
          );
        }
        previousBreakOnly = true;
      }
    } else {
      if (emptyRun >= 3 && !emptyRunReported) {
        issues.push(
          issueBase(
            'EMPTY_PARAGRAPHS',
            'blankPages',
            'warning',
            'Paragraf kosong beruntun',
            `${emptyRun} paragraf kosong berurutan dapat menambah jarak antar bagian.`,
            'Hapus paragraf kosong berlebih dan gunakan pengaturan spasi paragraf.',
            { blockIndex: block.index },
          ),
        );
        emptyRunReported = true;
      }
      if (!isEmpty) {
        previousBreakOnly = false;
        emptyRun = 0;
        emptyRunReported = false;
      }
    }
  }
  const unique = [];
  const seen = new Set();
  for (const issue of issues) {
    if (seen.has(issue.code)) continue;
    seen.add(issue.code);
    unique.push(issue);
  }
  return {
    key: 'blankPages',
    label: 'Halaman kosong',
    status: unique.length ? 'warning' : 'ok',
    summary: unique.length ? `${unique.length} indikasi halaman/paragraf kosong.` : 'Tidak ada indikasi halaman kosong signifikan.',
    issues: unique,
  };
}

function checkCaptions(blocks, config) {
  const requireImage = config.captions.requireImageCaption;
  const requireTable = config.captions.requireTableCaption;
  const issues = [];
  if (!requireImage && !requireTable) {
    return {
      key: 'captions',
      label: 'Keterangan gambar/tabel',
      status: 'ok',
      summary: 'Kewajiban keterangan gambar/tabel tidak diaktifkan pada template ini.',
      issues,
    };
  }
  const captionRe = /^(gambar|tabel|table|figure)\s+[0-9IVX]/i;
  blocks.forEach((block, index) => {
    if (block.type === 'w:p' && requireImage && block.data?.hasImage) {
      const prev = blocks[index - 1]?.data?.plainText || '';
      const next = blocks[index + 1]?.data?.plainText || '';
      const self = block.data.plainText || '';
      if (!captionRe.test(prev) && !captionRe.test(next) && !captionRe.test(self)) {
        issues.push(
          issueBase(
            'IMAGE_NO_CAPTION',
            'captions',
            'warning',
            'Gambar tanpa keterangan',
            'Ditemukan gambar tanpa paragraf keterangan "Gambar ..." di sekitarnya.',
            'Tambahkan keterangan gambar sesuai pedoman (mis. "Gambar 1.1 ...").',
            { blockIndex: block.index },
          ),
        );
      }
    }
    if (block.type === 'w:tbl' && requireTable) {
      const prev = blocks[index - 1]?.data?.plainText || '';
      const next = blocks[index + 1]?.data?.plainText || '';
      if (!captionRe.test(prev) && !captionRe.test(next)) {
        issues.push(
          issueBase(
            'TABLE_NO_CAPTION',
            'captions',
            'warning',
            'Tabel tanpa keterangan',
            'Ditemukan tabel tanpa paragraf keterangan "Tabel ..." di sekitarnya.',
            'Tambahkan keterangan tabel sesuai pedoman (mis. "Tabel 1.1 ...").',
            { blockIndex: block.index },
          ),
        );
      }
    }
  });
  return {
    key: 'captions',
    label: 'Keterangan gambar/tabel',
    status: issues.length ? 'warning' : 'ok',
    summary: issues.length ? `${issues.length} gambar/tabel tanpa keterangan.` : 'Gambar dan tabel memiliki keterangan.',
    issues,
  };
}

export async function analyzeDocument(buffer, config) {
  const zip = await readDocxBuffer(buffer);
  const documentXml = await zip.file('word/document.xml').async('string');
  const stylesXml = (await zip.file('word/styles.xml')?.async('string')) || '';
  const styles = parseStyles(stylesXml);
  const structure = getBodyStructure(documentXml);
  const headings = detectHeadings(structure.blocks, styles);
  const sections = getSectionProperties(structure.blocks);
  const coverEnd = getCoverEnd(structure.blocks, headings);

  const checks = [
    checkFonts(structure.blocks, headings, config, coverEnd),
    checkFontSizes(structure.blocks, headings, config, coverEnd),
    checkSpacing(structure.blocks, headings, config, coverEnd),
    checkIndent(structure.blocks, headings, config, coverEnd),
    checkAlignment(structure.blocks, headings, config, coverEnd),
    checkHeadings(structure.blocks, headings, config),
    checkMargins(sections, config),
    checkBlankPages(structure.blocks, coverEnd),
    checkCaptions(structure.blocks, config),
  ];
  const totals = { ok: 0, warning: 0, error: 0 };
  for (const check of checks) totals[check.status] = (totals[check.status] || 0) + 1;
  const score = Math.round(((totals.ok + totals.warning * 0.5) / checks.length) * 100);
  const allIssues = checks.flatMap((c) => c.issues).filter(Boolean);

  return {
    checks,
    totals,
    score,
    issueCount: allIssues.length,
    headings,
    sections: sections.map((s) => ({ margins: s.margins, numFmt: s.numFmt, hasFooter: s.hasFooterReference })),
    stats: {
      paragraphs: structure.blocks.filter((b) => b.type === 'w:p').length,
      tables: structure.blocks.filter((b) => b.type === 'w:tbl').length,
      images: (documentXml.match(/<a:blip\b|<v:imagedata\b/g) || []).length,
      headings: headings.length,
      sections: sections.length,
    },
    analyzedAt: new Date().toISOString(),
  };
}

export { parseParagraph, getSectionProperties };
