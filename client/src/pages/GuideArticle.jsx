import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock3, Info, CalendarDays } from 'lucide-react';
import { PublicShell } from '../components/PublicShell.jsx';
import { GUIDE_BY_SLUG, GUIDES, GUIDE_INDEX } from '../content/guides.js';
import { formatDate } from '../lib/format.js';
import { useDocumentMeta } from '../lib/useDocumentMeta.js';

function headingId(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function Block({ block }) {
  if (block.type === 'h2') {
    return (
      <h2 id={headingId(block.text)} className="mt-9 scroll-mt-24 text-[19px] font-semibold tracking-[-0.02em] text-ink-900">
        {block.text}
      </h2>
    );
  }
  if (block.type === 'p') {
    return <p className="mt-3 text-[14px] leading-[1.8] text-ink-700">{block.text}</p>;
  }
  if (block.type === 'ul') {
    return (
      <ul className="mt-3 space-y-2">
        {block.items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[14px] leading-[1.75] text-ink-700">
            <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === 'table') {
    return (
      <div className="mt-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[420px] text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-line bg-slate-50/70 text-[11px] uppercase tracking-[0.05em] text-ink-500">
              {block.head.map((cell) => (
                <th key={cell} scope="col" className="px-3 py-2 font-semibold">{cell}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {block.rows.map((row) => (
              <tr key={row.join('|')}>
                {row.map((cell, index) => (
                  <td key={index} className={index === 0 ? 'px-3 py-2 font-medium text-ink-800' : 'px-3 py-2 text-ink-600'}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (block.type === 'note') {
    return (
      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <p className="text-[12.5px] leading-relaxed text-amber-900">{block.text}</p>
      </div>
    );
  }
  return null;
}

export default function GuideArticle() {
  const { slug } = useParams();
  const guide = GUIDE_BY_SLUG.get(slug);

  useDocumentMeta({
    title: guide ? `${guide.title} — RapiMakalah` : GUIDE_INDEX.title,
    description: guide?.description || GUIDE_INDEX.description,
  });

  if (!guide) return <Navigate to="/panduan" replace />;

  const toc = guide.blocks.filter((b) => b.type === 'h2').map((b) => ({ id: headingId(b.text), text: b.text }));
  const related = (guide.related || []).map((s) => GUIDE_BY_SLUG.get(s)).filter(Boolean);

  return (
    <PublicShell>
      <article className="mx-auto max-w-5xl px-5 pb-14 pt-10">
        <nav aria-label="Breadcrumb" className="text-[11px] text-ink-400">
          <Link to="/" className="hover:text-ink-700">Beranda</Link>
          <span className="mx-1.5">/</span>
          <Link to="/panduan" className="hover:text-ink-700">Panduan</Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink-600">{guide.category}</span>
        </nav>

        <div className="mt-5 grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">{guide.category}</p>
            <h1 className="mt-2 text-[27px] font-semibold leading-tight tracking-[-0.03em] text-ink-900 sm:text-[32px]">
              {guide.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-[11.5px] text-ink-500">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Diperbarui {formatDate(guide.date)}</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {guide.readingMinutes} menit baca</span>
            </div>

            <p className="mt-5 text-[14.5px] leading-[1.8] text-ink-700">{guide.description}</p>

            <div className="mt-2">
              {guide.blocks.map((block, index) => (
                <Block key={`${block.type}-${index}`} block={block} />
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-line bg-slate-50 px-5 py-6">
              <h2 className="text-[15px] font-semibold text-ink-900">Terapkan otomatis di dokumen Anda</h2>
              <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-ink-500">
                Unggah DOCX, pilih pedoman, dan lihat temuan formatnya. RapiMakalah mengedit file asli sehingga tabel, gambar, dan tautan tetap utuh.
              </p>
              <Link to="/register" className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand-600 px-4 text-[13px] font-medium text-white transition hover:bg-brand-700">
                Mulai gratis <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-400">Di halaman ini</p>
              <nav aria-label="Daftar isi artikel" className="mt-2 border-l border-line">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="-ml-px block border-l border-transparent py-1.5 pl-3 text-[12px] leading-snug text-ink-500 transition hover:border-brand-400 hover:text-ink-900"
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-12 border-t border-line pt-8">
            <h2 className="text-[13px] font-semibold text-ink-900">Baca juga</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  to={item.path}
                  className="group rounded-xl border border-line bg-white p-4 transition hover:border-slate-300"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-700">{item.category}</p>
                  <p className="mt-1 text-[13px] font-medium leading-snug text-ink-900 group-hover:text-brand-700">{item.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8">
          <Link to="/panduan" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-500 hover:text-ink-900">
            <ArrowLeft className="h-3.5 w-3.5" /> Semua panduan
          </Link>
        </div>
      </article>
    </PublicShell>
  );
}
