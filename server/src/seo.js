import { GUIDES, GUIDE_INDEX, guidePlainText } from '../../client/src/content/guides.js';
import { config } from './config.js';

const SITE = config.canonicalUrl.replace(/\/$/, '');
const SITE_NAME = 'RapiMakalah';

/** Per-route metadata for the public (indexable) pages. */
const PAGES = {
  '/': {
    title: 'RapiMakalah — Rapikan Format Makalah & Skripsi DOCX Otomatis',
    description:
      'RapiMakalah merapikan format makalah dan skripsi Word (.docx) secara otomatis: margin 4-4-3-3, Times New Roman 12, spasi 1,5, heading BAB, penomoran halaman Romawi/Arab, daftar isi, daftar pustaka, dan cover. Cek format sebelum dikumpulkan.',
    keywords:
      'rapikan makalah, format makalah, format skripsi, perapi makalah online, margin makalah, daftar isi otomatis, penomoran halaman word, docx, word, mahasiswa',
    robots: 'index,follow,max-image-preview:large',
    type: 'website',
  },
  '/login': {
    title: 'Masuk — RapiMakalah',
    description: 'Masuk ke RapiMakalah untuk merapikan format makalah dan skripsi Word Anda.',
    robots: 'index,follow',
    type: 'website',
  },
  '/register': {
    title: 'Daftar Gratis — RapiMakalah',
    description:
      'Buat akun RapiMakalah gratis dan rapikan format makalah, skripsi, dan laporan Word dalam hitungan detik.',
    robots: 'index,follow',
    type: 'website',
  },
  '/galeri': {
    title: 'Galeri Template Makalah — RapiMakalah',
    description:
      'Jelajahi template format makalah dan skripsi yang dibagikan komunitas RapiMakalah. Lihat pengaturan margin, font, heading, dan penomoran halaman, lalu simpan salinannya ke akun Anda.',
    keywords:
      'galeri template makalah, template format skripsi, template word mahasiswa, format makalah kampus, bagi template',
    robots: 'index,follow,max-image-preview:large',
    type: 'website',
  },
  '/panduan': {
    title: GUIDE_INDEX.title,
    description: GUIDE_INDEX.description,
    keywords:
      'panduan format makalah, cara mengatur margin, daftar pustaka, penomoran halaman, struktur skripsi, microsoft word',
    robots: 'index,follow,max-image-preview:large',
    type: 'website',
    index: { heading: GUIDE_INDEX.heading, intro: GUIDE_INDEX.intro },
  },
};

for (const guide of GUIDES) {
  PAGES[guide.path] = {
    title: `${guide.title} — RapiMakalah`,
    description: guide.description,
    keywords: guide.keywords,
    robots: 'index,follow,max-image-preview:large',
    type: 'article',
    guide,
  };
}

/** Private routes: keep them out of the index even if linked from somewhere. */
const PRIVATE_PREFIXES = ['/app', '/api'];

function normalize(pathname) {
  if (!pathname) return '/';
  const clean = pathname.replace(/\/+$/, '') || '/';
  return clean;
}

export function isPrivatePath(pathname) {
  return PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function metaFor(pathname) {
  const path = normalize(pathname);
  const page = PAGES[path];
  if (!page)
    return {
      path,
      private: true,
      robots: 'noindex,nofollow',
      title: `Halaman aplikasi — ${SITE_NAME}`,
      description: 'Area aplikasi RapiMakalah. Halaman ini tidak diindeks mesin pencari.',
      keywords: '',
      type: 'website',
    };
  return { path, ...page, private: false };
}

function esc(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function breadcrumbItems(meta) {
  const items = [{ '@type': 'ListItem', position: 1, name: 'Beranda', item: `${SITE}/` }];
  if (meta.path === '/panduan') {
    items.push({ '@type': 'ListItem', position: 2, name: 'Panduan', item: `${SITE}/panduan` });
  } else if (meta.type === 'article') {
    items.push({ '@type': 'ListItem', position: 2, name: 'Panduan', item: `${SITE}/panduan` });
    items.push({ '@type': 'ListItem', position: 3, name: meta.title.split(' — ')[0], item: `${SITE}${meta.path}` });
  } else if (meta.path !== '/') {
    items.push({ '@type': 'ListItem', position: 2, name: meta.title.split(' — ')[0], item: `${SITE}${meta.path}` });
  }
  return items;
}

function structuredData(meta) {
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: SITE_NAME,
      description: PAGES['/'].description,
      inLanguage: 'id-ID',
      publisher: { '@id': `${SITE}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: SITE_NAME,
      url: `${SITE}/`,
      logo: `${SITE}/favicon.png`,
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE}/#app`,
      name: SITE_NAME,
      url: `${SITE}/`,
      applicationCategory: 'EducationalApplication',
      applicationSubCategory: 'Document formatting',
      operatingSystem: 'Web',
      inLanguage: 'id-ID',
      description: PAGES['/'].description,
      featureList: [
        'Merapikan margin dan font dokumen Word',
        'Menyeragamkan spasi, indentasi, dan perataan',
        'Penomoran halaman Romawi dan Arab per section',
        'Daftar isi otomatis dengan nomor halaman',
        'Daftar pustaka menggantung dan tautan URL',
        'Cover dan kata pengantar otomatis',
      ],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE}${meta.path}#breadcrumb`,
      itemListElement: breadcrumbItems(meta),
    },
  ];

  if (meta.type === 'article' && meta.guide) {
    const guide = meta.guide;
    graph.push({
      '@type': 'Article',
      '@id': `${SITE}${meta.path}#article`,
      headline: guide.title,
      description: guide.description,
      inLanguage: 'id-ID',
      datePublished: guide.date,
      dateModified: guide.date,
      author: { '@id': `${SITE}/#organization` },
      publisher: { '@id': `${SITE}/#organization` },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}${meta.path}` },
      articleSection: guide.category,
      keywords: guide.keywords,
      image: `${SITE}/favicon.png`,
      isPartOf: { '@id': `${SITE}/#website` },
    });
  }

  return jsonLd({ '@context': 'https://schema.org', '@graph': graph });
}

function headTags(meta) {
  const url = `${SITE}${meta.path === '/' ? '/' : meta.path}`;
  const tags = [
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta name="robots" content="${esc(meta.robots)}" />`,
    `<meta name="keywords" content="${esc(meta.keywords || 'rapikan makalah, format skripsi, word')}" />`,
    `<meta name="author" content="${SITE_NAME}" />`,
    `<meta name="theme-color" content="#0f172a" />`,
    `<meta property="og:type" content="${meta.type === 'article' ? 'article' : 'website'}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="id_ID" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:image" content="${SITE}/favicon.png" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
  ];
  if (meta.type === 'article' && meta.guide) {
    tags.push(
      `<meta property="article:published_time" content="${meta.guide.date}" />`,
      `<meta property="article:modified_time" content="${meta.guide.date}" />`,
      `<meta property="article:section" content="${esc(meta.guide.category)}" />`,
    );
  }
  tags.push(structuredData(meta));
  return tags.join('\n    ');
}

/**
 * HTML pengganti <noscript> untuk crawler yang tidak menjalankan JavaScript.
 * Halaman panduan mendapat ringkasan artikelnya sendiri, bukan ringkasan beranda.
 */
function noscriptFor(meta) {
  const wrapper = (inner) =>
    `<noscript>\n      <div style="max-width: 40rem; margin: 3rem auto; padding: 0 1.25rem; font-family: system-ui, sans-serif; line-height: 1.6; color: #1e293b">\n${inner}\n      </div>\n    </noscript>`;

  if (meta.path === '/panduan' && meta.index) {
    const list = GUIDES.map((g) => `        <li><a href="${g.path}">${esc(g.title)}</a> — ${esc(g.description)}</li>`).join('\n');
    return wrapper(
      [
        `        <h1>${esc(meta.index.heading)}</h1>`,
        `        <p>${esc(meta.index.intro)}</p>`,
        '        <ul>',
        list,
        '        </ul>',
        '        <p><a href="/register">Daftar gratis</a> · <a href="/login">Masuk</a></p>',
      ].join('\n'),
    );
  }

  if (!meta.guide) return null;

  const guide = meta.guide;
  return wrapper(
    [
      `        <p><a href="/">RapiMakalah</a> / <a href="/panduan">Panduan</a> / ${esc(guide.category)}</p>`,
      `        <h1>${esc(guide.title)}</h1>`,
      `        <p>${esc(guidePlainText(guide, 1600))}</p>`,
      `        <p><a href="/panduan">Panduan lainnya</a> · <a href="/register">Daftar gratis</a> · <a href="/login">Masuk</a></p>`,
    ].join('\n'),
  );
}

/**
 * Replace the base title/description of the built index.html with metadata
 * that matches the requested route, and add canonical/OG/JSON-LD tags.
 * Untuk halaman panduan, isi <noscript> juga diganti ringkasan artikel.
 */
export function injectSeo(html, pathname) {
  const meta = metaFor(pathname);
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(meta.description)}" />`);
  // Drop the static robots/canonical placeholders so route values are the only ones.
  out = out.replace(/\n\s*<link rel="canonical"[^>]*>/g, '').replace(/\n\s*<meta name="robots"[^>]*>/g, '');
  out = out.replace('</head>', `    ${headTags(meta)}\n  </head>`);
  const noscript = noscriptFor(meta);
  if (noscript) out = out.replace(/<noscript>[\s\S]*?<\/noscript>/, noscript);
  return out;
}

/** Response header that keeps private and unknown pages out of search results. */
export function robotsHeaderFor(pathname) {
  return metaFor(pathname).private ? 'noindex, nofollow' : null;
}
