import { useMemo, useState } from 'react';
import { BookOpen, FileText, Layers, ListTree } from 'lucide-react';
import { cx } from '../../lib/format.js';

function pageLabel(page, index) {
  const heading = page.blocks.find((block) => block.headingLevel);
  if (heading?.text) return heading.text.replace(/\s+/g, ' ').slice(0, 42);
  const text = page.blocks.find((block) => block.text?.trim())?.text;
  if (text) return text.replace(/\s+/g, ' ').slice(0, 42);
  return page.blocks.some((block) => block.images?.length) ? 'Halaman bergambar' : 'Halaman kosong';
}

const NUMBER_LABEL = { decimal: '1, 2, 3', upperRoman: 'I, II, III', lowerRoman: 'i, ii, iii', upperLetter: 'A, B, C', lowerLetter: 'a, b, c' };
const ALIGN_LABEL = { justify: 'rata kanan-kiri', left: 'rata kiri', center: 'tengah', right: 'rata kanan' };

function RulesList({ config }) {
  if (!config) return <p className="px-2 py-4 text-[10px] text-ink-400">Template belum dipilih.</p>;
  const { page, typography: t, headings: h, pageNumbering: n, toc } = config;
  const m = page.margins;
  const groups = [
    { title: 'Halaman', items: [`Kertas ${page.size} ${page.orientation === 'landscape' ? 'landscape' : 'portrait'}`, `Margin atas ${m.top} · kiri ${m.left} · bawah ${m.bottom} · kanan ${m.right} cm`] },
    { title: 'Isi teks', items: [`${t.fontFamily} ${t.fontSize} pt`, `Spasi ${t.lineSpacing}, ${ALIGN_LABEL[t.alignment]}`, `Indentasi baris pertama ${t.firstLineIndent} cm`] },
    { title: 'Heading', items: [`BAB: ${h.chapter.fontSize} pt${h.chapter.bold ? ', tebal' : ''}${h.chapter.uppercase ? ', kapital' : ''}, ${ALIGN_LABEL[h.chapter.alignment]}`, `Subbab: ${h.subheading.fontSize} pt${h.subheading.bold ? ', tebal' : ''}, ${ALIGN_LABEL[h.subheading.alignment]}`] },
    { title: 'Urutan bagian', items: ['Cover (tanpa nomor)', 'Kata pengantar & daftar isi', 'BAB I dst. (isi)', 'Daftar pustaka'] },
    { title: 'Nomor halaman', items: [n.enabled ? `Cover tanpa nomor · bagian awal ${NUMBER_LABEL[n.frontMatter]} · isi ${NUMBER_LABEL[n.body]}` : 'Nonaktif', `Posisi: ${n.position.replace('-', ' ')}`] },
    { title: 'Daftar isi', items: [toc.enabled ? `Otomatis, kedalaman heading ${toc.depth}` : 'Nonaktif'] },
  ];
  return (
    <div className="space-y-3 px-1 py-1">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">{group.title}</p>
          <ul className="mt-1 space-y-1">
            {group.items.map((item) => (
              <li key={item} className="text-[10px] leading-snug text-ink-600">• {item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function PageSidebar({ preview, pageIndex, onPageChange, headings = [], activeVariantLabel, onHeadingClick, config }) {
  const [tab, setTab] = useState('pages');
  const pages = preview?.pages || [];
  const pagesForHeading = useMemo(() => {
    const map = new Map();
    pages.forEach((page, index) => {
      page.blocks.forEach((block) => {
        if (block.headingLevel) map.set(block.blockIndex, index);
      });
    });
    return map;
  }, [pages]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 border-b border-line px-2 pt-2">
        <button
          type="button"
          onClick={() => setTab('pages')}
          className={cx(
            'flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 pb-2 pt-1 text-[11px] font-medium transition',
            tab === 'pages' ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-400 hover:text-ink-700',
          )}
        >
          <Layers className="h-3 w-3" /> Halaman
        </button>
        <button
          type="button"
          onClick={() => setTab('outline')}
          className={cx(
            'flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 pb-2 pt-1 text-[11px] font-medium transition',
            tab === 'outline' ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-400 hover:text-ink-700',
          )}
        >
          <ListTree className="h-3 w-3" /> Struktur
        </button>
        <button
          type="button"
          onClick={() => setTab('rules')}
          className={cx(
            'flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 pb-2 pt-1 text-[11px] font-medium transition',
            tab === 'rules' ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-400 hover:text-ink-700',
          )}
        >
          <BookOpen className="h-3 w-3" /> Aturan
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {tab === 'rules' ? (
          <RulesList config={config} />
        ) : tab === 'pages' ? (
          pages.length ? (
            <div className="space-y-0.5">
              {pages.map((page, index) => (
                <button
                  key={page.number}
                  type="button"
                  onClick={() => onPageChange(index)}
                  className={cx(
                    'group flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition',
                    index === pageIndex ? 'bg-brand-50' : 'hover:bg-slate-50',
                  )}
                >
                  <span
                    className={cx(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[9px] font-medium tabular-nums',
                      index === pageIndex ? 'border-brand-200 bg-white text-brand-700' : 'border-line bg-white text-ink-400',
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cx(
                        'line-clamp-2 block text-[10px] leading-snug',
                        index === pageIndex ? 'font-medium text-brand-800' : 'text-ink-600',
                      )}
                    >
                      {pageLabel(page, index)}
                    </span>
                    <span className="mt-0.5 block text-[8px] text-ink-400">
                      {page.blocks.length} blok
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-2 py-4 text-[10px] leading-relaxed text-ink-400">Preview belum tersedia.</p>
          )
        ) : headings.length ? (
          <div className="space-y-0.5">
            {headings.map((heading) => {
              const page = pagesForHeading.get(heading.blockIndex);
              return (
                <button
                  key={`${heading.blockIndex}-${heading.text}`}
                  type="button"
                  onClick={() => (page !== undefined ? onHeadingClick(page) : onHeadingClick?.(0))}
                  className="flex w-full items-start gap-1.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50"
                  style={{ paddingLeft: 8 + (heading.level - 1) * 12 }}
                >
                  <span className="mt-0.5 w-3 shrink-0 font-mono text-[8px] text-ink-300">H{heading.level}</span>
                  <span className="line-clamp-2 flex-1 text-[10px] leading-snug text-ink-600">{heading.text}</span>
                  {page !== undefined && <span className="shrink-0 text-[8px] tabular-nums text-ink-300">{page + 1}</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-line px-3 py-4">
            <p className="text-[10px] font-medium text-ink-600">Heading tidak terdeteksi</p>
            <p className="mt-1 text-[9px] leading-relaxed text-ink-400">
              Gunakan style Heading 1/2/3 atau awali judul bab dengan “BAB”.
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-line px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-[9px] text-ink-400">
          <FileText className="h-2.5 w-2.5" />
          <span>{activeVariantLabel}</span>
        </div>
        <p className="mt-1 text-[8px] leading-relaxed text-ink-400">Pagination estimasi, bukan layout Microsoft Word.</p>
      </div>
    </div>
  );
}
