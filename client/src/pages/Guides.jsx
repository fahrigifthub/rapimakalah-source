import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock3 } from 'lucide-react';
import { PublicShell } from '../components/PublicShell.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { GUIDES, GUIDE_INDEX } from '../content/guides.js';
import { useDocumentMeta } from '../lib/useDocumentMeta.js';

export default function Guides() {
  useDocumentMeta({ title: GUIDE_INDEX.title, description: GUIDE_INDEX.description });

  return (
    <PublicShell>
      <section className="border-b border-line bg-[#FBFCFE]">
        <div className="mx-auto max-w-5xl px-5 pb-12 pt-14 sm:pt-16">
          <nav aria-label="Breadcrumb" className="text-[11px] text-ink-400">
            <Link to="/" className="hover:text-ink-700">Beranda</Link>
            <span className="mx-1.5">/</span>
            <span className="text-ink-600">Panduan</span>
          </nav>
          <h1 className="mt-4 text-[30px] font-semibold tracking-[-0.03em] sm:text-[36px]">{GUIDE_INDEX.heading}</h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-600">{GUIDE_INDEX.intro}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {GUIDES.map((guide) => (
            <article key={guide.slug} className="group flex flex-col rounded-2xl border border-line bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <Badge tone="blue">{guide.category}</Badge>
                <span className="inline-flex items-center gap-1 text-[11px] text-ink-400">
                  <Clock3 className="h-3 w-3" /> {guide.readingMinutes} menit
                </span>
              </div>
              <h2 className="mt-4 text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink-900">
                <Link to={guide.path} className="transition hover:text-brand-700">
                  {guide.title}
                </Link>
              </h2>
              <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-ink-500">{guide.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-brand-700">
                Baca panduan <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl border border-line bg-slate-50 px-6 py-8 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <BookOpen className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold text-ink-900">Tidak perlu mengatur semuanya manual</h2>
              <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-ink-500">
                RapiMakalah menerapkan margin, font, spasi, heading, penomoran halaman, dan daftar pustaka langsung ke DOCX asli Anda.
              </p>
            </div>
          </div>
          <Link
            to="/register"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-4 text-[13px] font-medium text-white transition hover:bg-brand-700"
          >
            Coba gratis <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
