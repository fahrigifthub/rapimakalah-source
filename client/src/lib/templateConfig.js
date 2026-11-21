/**
 * Client-side mirror of the server template defaults.
 * Kept in a shared module so the template editor can start from a valid config
 * before the first request, and can reset a form without a round-trip.
 */

const baseHeadings = {
  chapter: {
    fontFamily: 'Times New Roman',
    fontSize: 14,
    bold: true,
    alignment: 'center',
    spaceBefore: 0,
    spaceAfter: 12,
    uppercase: true,
  },
  subheading: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    bold: true,
    alignment: 'left',
    spaceBefore: 6,
    spaceAfter: 6,
  },
  subsubheading: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    bold: true,
    alignment: 'left',
    spaceBefore: 4,
    spaceAfter: 4,
  },
};

export const DEFAULT_TEMPLATE_CONFIG = {
  page: {
    size: 'A4',
    orientation: 'portrait',
    margins: { top: 3, right: 3, bottom: 3, left: 4 },
  },
  typography: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    lineSpacing: 1.5,
    spaceBefore: 0,
    spaceAfter: 0,
    firstLineIndent: 1.25,
    alignment: 'justify',
  },
  headings: baseHeadings,
  pageNumbering: {
    enabled: true,
    position: 'bottom-center',
    cover: false,
    frontMatter: 'lowerRoman',
    body: 'decimal',
    bodyRestart: true,
  },
  toc: { enabled: true, depth: 3, title: 'DAFTAR ISI', includeTocTitle: true },
  bibliography: { linkUrls: true, hangingIndent: 1.27, alignment: 'justify' },
  cover: { titleSize: 16, institutionSize: 16, showDepartment: true, institutionAtBottom: true },
  captions: { requireImageCaption: false, requireTableCaption: false },
};

export function normalizeTemplateConfig(input = {}) {
  const base = structuredClone(DEFAULT_TEMPLATE_CONFIG);
  const merge = (target, source) => {
    if (!source || typeof source !== 'object') return target;
    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === 'object' && !Array.isArray(value) && typeof target[key] === 'object') {
        merge(target[key], value);
      } else if (value !== undefined) {
        target[key] = value;
      }
    }
    return target;
  };
  return merge(base, input);
}

export function updateConfigPath(config, path, value) {
  const keys = path.split('.');
  const next = structuredClone(config);
  let target = next;
  for (let i = 0; i < keys.length - 1; i += 1) target = target[keys[i]];
  target[keys[keys.length - 1]] = value;
  return next;
}

export const PAGE_NUMBER_LABELS = {
  decimal: '1, 2, 3',
  upperRoman: 'I, II, III',
  lowerRoman: 'i, ii, iii',
  upperLetter: 'A, B, C',
  lowerLetter: 'a, b, c',
};

export const PAGE_NUMBER_POSITIONS = {
  'bottom-center': 'Bawah · tengah',
  'bottom-right': 'Bawah · kanan',
  'top-center': 'Atas · tengah',
  'top-right': 'Atas · kanan',
};

export const ALIGNMENT_LABELS = {
  left: 'Kiri',
  center: 'Tengah',
  right: 'Kanan',
  justify: 'Justify',
};

export function configSummary(config) {
  const safe = normalizeTemplateConfig(config);
  const margin = safe.page.margins;
  return [
    `${safe.page.size} · ${safe.page.orientation === 'landscape' ? 'landscape' : 'portrait'}`,
    `Margin ${margin.top}/${margin.right}/${margin.bottom}/${margin.left} cm`,
    `${safe.typography.fontFamily} ${safe.typography.fontSize} pt · spasi ${safe.typography.lineSpacing}×`,
    `${PAGE_NUMBER_LABELS[safe.pageNumbering.frontMatter] || '—'} → ${PAGE_NUMBER_LABELS[safe.pageNumbering.body] || '—'}`,
  ];
}

export const CATEGORY_OPTIONS = ['Makalah', 'Laporan', 'Proposal', 'Skripsi', 'Tesis', 'Disertasi', 'Jurnal', 'Lainnya'];
