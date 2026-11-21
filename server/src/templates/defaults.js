/**
 * RapiMakalah format template catalog.
 * All measurements: margins/indent in centimetres, font size in points,
 * line spacing as a multiple, paragraph spacing in points.
 *
 * These are sensible defaults based on common Indonesian campus guidelines —
 * not a claim that every institution uses them. Users can clone and edit.
 */

const baseTypography = {
  fontFamily: 'Times New Roman',
  fontSize: 12,
  lineSpacing: 1.5,
  spaceBefore: 0,
  spaceAfter: 0,
  firstLineIndent: 1.25,
  alignment: 'justify',
};

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

const basePage = {
  size: 'A4',
  orientation: 'portrait',
  margins: { top: 3, right: 3, bottom: 3, left: 4 },
};

const basePageNumbering = {
  enabled: true,
  position: 'bottom-center',
  cover: false,
  frontMatter: 'lowerRoman',
  body: 'decimal',
  bodyRestart: true,
};

export const DEFAULT_TEMPLATE_CONFIG = {
  page: basePage,
  typography: baseTypography,
  headings: baseHeadings,
  pageNumbering: basePageNumbering,
  toc: { enabled: true, depth: 3, title: 'DAFTAR ISI', includeTocTitle: true },
  bibliography: { linkUrls: true, hangingIndent: 1.27, alignment: 'justify' },
  cover: { titleSize: 16, institutionSize: 16, showDepartment: true, institutionAtBottom: true },
  captions: { requireImageCaption: false, requireTableCaption: false },
};

export const SYSTEM_TEMPLATES = [
  {
    key: 'makalah',
    name: 'Makalah',
    category: 'Makalah',
    description: 'Format umum makalah kuliah: A4, margin 4-3-3-3 cm, Times New Roman 12 pt, spasi 1,5.',
    config: DEFAULT_TEMPLATE_CONFIG,
  },
  {
    key: 'laporan-praktikum',
    name: 'Laporan Praktikum',
    category: 'Laporan',
    description: 'Untuk laporan kegiatan praktikum: spasi 1,5 dengan heading praktikum yang tegas.',
    config: {
      ...DEFAULT_TEMPLATE_CONFIG,
      headings: {
        ...baseHeadings,
        chapter: { ...baseHeadings.chapter, fontSize: 14, spaceAfter: 10 },
      },
    },
  },
  {
    key: 'proposal',
    name: 'Proposal',
    category: 'Proposal',
    description: 'Format proposal penelitian/skripsi dengan margin 4-3-3-3 cm dan daftar isi otomatis.',
    config: DEFAULT_TEMPLATE_CONFIG,
  },
  {
    key: 'laporan-pkl',
    name: 'Laporan PKL',
    category: 'Laporan',
    description: 'Format laporan Praktik Kerja Lapangan dengan penomoran bab Romawi dan halaman Arab.',
    config: {
      ...DEFAULT_TEMPLATE_CONFIG,
      page: { ...basePage, margins: { top: 3, right: 3, bottom: 3, left: 4 } },
      pageNumbering: { ...basePageNumbering, position: 'bottom-right' },
    },
  },
  {
    key: 'skripsi',
    name: 'Skripsi',
    category: 'Skripsi',
    description: 'Format skripsi: margin atas 4 cm, spasi 2,0, Times New Roman 12 pt, BAB 14 pt.',
    config: {
      ...DEFAULT_TEMPLATE_CONFIG,
      page: { ...basePage, margins: { top: 4, right: 3, bottom: 3, left: 4 } },
      typography: { ...baseTypography, lineSpacing: 2 },
      headings: {
        ...baseHeadings,
        chapter: { ...baseHeadings.chapter, fontSize: 14, spaceAfter: 16 },
      },
    },
  },
];

export const PAPER_SIZES = {
  A4: { width: 21.0, height: 29.7 },
  F4: { width: 21.59, height: 33.0 },
  Letter: { width: 21.59, height: 27.94 },
  A5: { width: 14.8, height: 21.0 },
};

export const PAGE_NUMBER_FORMATS = ['decimal', 'upperRoman', 'lowerRoman', 'upperLetter', 'lowerLetter'];
export const ALIGNMENTS = ['left', 'center', 'right', 'justify'];

// Deep-merge defaults so partial custom templates remain valid.
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
