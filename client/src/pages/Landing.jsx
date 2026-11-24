import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  FileSearch,
  FileText,
  Fingerprint,
  Layers,
  LayoutTemplate,
  ListChecks,
  LockKeyhole,
  MousePointerClick,
  ScanLine,
  ShieldCheck,
  Sparkles,
  SquarePen,
  Type,
  UploadCloud,
  Wand2,
} from 'lucide-react';
import { Logo } from '../components/ui/Common.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { GUIDES } from '../content/guides.js';

const NAV_LINKS = [
  { href: '#fitur', label: 'Fitur' },
  { href: '#cara-kerja', label: 'Cara kerja' },
  { href: '#keamanan', label: 'Keamanan' },
  { href: '/galeri', label: 'Galeri' },
  { href: '/panduan', label: 'Panduan' },
];

const PAIN_POINTS = [
  { title: 'Margin & font berubah-ubah', text: 'Setiap bab punya spasi dan jenis huruf yang berbeda.' },
  { title: 'Nomor halaman kacau', text: 'Romawi di awal, Arab di isi, cover malah ikut bernomor.' },
  { title: 'Daftar isi manual', text: 'Nomor halaman harus diperbarui satu per satu setiap revisi.' },
  { title: 'Pedoman tiap kampus beda', text: 'Template generik tidak cukup untuk pedoman dosen Anda.' },
];

const FEATURES = [
  {
    icon: SquarePen,
    title: 'Mengedit DOCX asli, bukan membangun ulang',
    text: 'RapiMakalah memodifikasi OOXML di dalam file Word. Tabel, gambar, hyperlink, catatan kaki, dan isi tulisan tetap di tempatnya.',
    bullets: ['Format diterapkan pada run & paragraf', 'File asli selalu disimpan', 'Hasil bisa dibuka dan diedit di Word'],
  },
  {
    icon: FileSearch,
    title: 'Pemeriksa yang menjelaskan, bukan menghakimi',
    text: 'Setiap temuan menyebut paragraf, nilai yang ditemukan, nilai yang diharapkan, dan rekomendasi perbaikannya.',
    bullets: ['Konsistensi font & ukuran teks', 'Margin, spasi, indentasi, perataan', 'Heading, halaman kosong, keterangan gambar'],
  },
  {
    icon: Layers,
    title: 'Section Word untuk penomoran halaman',
    text: 'Cover tanpa nomor, bagian awal Romawi, bagian isi Arab — dibuat sebagai section break dan field PAGE yang nyata.',
    bullets: ['Posisi nomor bawah/tengah/kanan', 'Restart nomor di bagian isi', 'Dapat diperiksa di Word'],
  },
  {
    icon: ListChecks,
    title: 'Daftar isi berupa field TOC',
    text: 'Heading dideteksi dari style, outline level, dan pola “BAB”. RapiMakalah menyisipkan field TOC yang bisa diperbarui di Word.',
    bullets: ['Kedalaman heading dapat diatur', 'Memberi tahu jika heading tidak ditemukan', 'Tidak menjanjikan pagination palsu'],
  },
];

const STEPS = [
  { icon: UploadCloud, title: 'Unggah DOCX', text: 'Validasi ekstensi, MIME, signature file, dan struktur OOXML.' },
  { icon: LayoutTemplate, title: 'Pilih pedoman', text: 'Gunakan template bawaan atau buat konfigurasi kampus sendiri.' },
  { icon: ScanLine, title: 'Periksa temuan', text: 'Lihat status Sesuai, Perlu diperiksa, dan Tidak sesuai beserta alasannya.' },
  { icon: CheckCircle2, title: 'Rapikan & unduh', text: 'Terapkan aturan yang dipilih, bandingkan, lalu unduh DOCX yang siap diedit.' },
];

const TEMPLATES = ['Makalah'];

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-white text-ink-900">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) =>
              link.href.startsWith('/') ? (
                <Link key={link.href} to={link.href} className="text-[13px] font-medium text-ink-500 transition hover:text-ink-900">
                  {link.label}
                </Link>
              ) : (
                <a key={link.href} href={link.href} className="text-[13px] font-medium text-ink-500 transition hover:text-ink-900">
                  {link.label}
                </a>
              ),
            )}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/app" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink-900 px-4 text-[13px] font-medium text-white transition hover:bg-slate-800">
                Buka workspace <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden h-9 items-center rounded-lg px-3 text-[13px] font-medium text-ink-600 transition hover:bg-slate-50 sm:inline-flex">
                  Masuk
                </Link>
                <Link to="/register" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink-900 px-4 text-[13px] font-medium text-white transition hover:bg-slate-800">
                  Mulai gratis <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-[#FBFCFE]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #EEF1F6 1px, transparent 1px), linear-gradient(to bottom, #EEF1F6 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'linear-gradient(to bottom, black, transparent 78%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-ink-600 shadow-sm">
              <Sparkles className="h-3 w-3 text-brand-600" />
              Pemrosesan DOCX nyata — bukan mockup
            </span>
            <h1 className="mt-6 text-[38px] font-semibold leading-[1.08] tracking-[-0.04em] text-ink-900 sm:text-[54px]">
              Rapikan format makalah
              <br className="hidden sm:block" />
              <span className="text-brand-600"> tanpa mengorbankan isinya.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink-500">
              RapiMakalah memeriksa dan merapikan dokumen Word akademik sesuai pedoman format. Margin, font, spasi,
              heading, penomoran halaman, dan daftar isi — langsung di file DOCX Anda.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
              <Link
                to={user ? '/app' : '/register'}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 sm:w-auto"
              >
                {user ? 'Buka workspace' : 'Mulai rapikan sekarang'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#cara-kerja"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 text-sm font-medium text-ink-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
              >
                Lihat cara kerjanya
              </a>
            </div>
            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-ink-400">
              <span className="flex items-center gap-1.5"><Check className="h-3 w-3" /> Maks. 20 MB</span>
              <span className="flex items-center gap-1.5"><Check className="h-3 w-3" /> File tidak untuk training AI</span>
              <span className="flex items-center gap-1.5"><Check className="h-3 w-3" /> Tetap editable di Word</span>
            </p>
          </div>

          <WorkspaceMockup />
        </div>
      </section>

      {/* Pain points */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-line px-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {PAIN_POINTS.map((item, index) => (
            <div key={item.title} className="px-0 py-6 sm:px-5 lg:px-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold tabular-nums text-ink-300">0{index + 1}</span>
                <h2 className="text-[13px] font-semibold text-ink-800">{item.title}</h2>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-500">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="mx-auto max-w-6xl px-5 py-20">
        <div className="max-w-2xl">
          <Badge tone="blue">Fitur inti</Badge>
          <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.03em] sm:text-[36px]">
            Yang RapiMakalah kerjakan pada level dokumen
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-500">
            Fokusnya bukan tampilan editor. Fokusnya adalah memastikan struktur OOXML dan format akademik Anda konsisten.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-line bg-white p-6 transition hover:border-slate-300">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <feature.icon className="h-[18px] w-[18px]" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold tracking-[-0.01em]">{feature.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{feature.text}</p>
              <ul className="mt-4 space-y-1.5">
                {feature.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2 text-[12px] text-ink-600">
                    <Check className="h-3 w-3 shrink-0 text-emerald-600" strokeWidth={2.5} />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="cara-kerja" className="border-y border-line bg-slate-50/70">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge tone="slate">Alur kerja</Badge>
              <h2 className="mt-4 text-[30px] font-semibold tracking-[-0.03em]">Empat langkah, satu file hasil.</h2>
            </div>
            <p className="max-w-sm text-[13px] leading-relaxed text-ink-500">
              Anda tetap memegang kendali: pilih aturan mana yang diterapkan, lihat temuan, dan bandingkan sebelum mengunduh.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative rounded-xl border border-line bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                    <step.icon className="h-4 w-4" />
                  </span>
                  <span className="font-mono text-[11px] text-ink-300">0{index + 1}</span>
                </div>
                <h3 className="mt-4 text-[13px] font-semibold">{step.title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates + honesty */}
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-20 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <Badge tone="blue">Template</Badge>
          <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.03em]">
            Pedoman yang bisa disesuaikan, bukan dikunci.
          </h2>
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-ink-500">
            Gunakan template bawaan sebagai titik awal. Setiap properti — kertas, margin, font, spasi, indentasi,
            heading, penomoran, dan daftar isi — dapat diubah dan disimpan sebagai template kustom.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {TEMPLATES.map((name) => (
              <span key={name} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] font-medium text-ink-700">
                <FileText className="h-3.5 w-3.5 text-ink-400" /> {name}
              </span>
            ))}
          </div>
          <Link to={user ? '/app/templates' : '/register'} className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 hover:text-brand-700">
            Lihat template library <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-amber-800">
            <AlertTriangle className="h-4 w-4" /> Batasan yang kami nyatakan terbuka
          </div>
          <h3 className="mt-3 text-[15px] font-semibold text-amber-900">RapiMakalah tidak berpura-pura menjadi Microsoft Word.</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-amber-800/90">
            Preview adalah render struktural, bukan mesin layout Word. Pagination dan nomor halaman TOC bersifat estimasi
            sampai Word memperbarui field-nya. Tabel kompleks, text box, dan shape ditampilkan sederhana.
          </p>
          <div className="mt-4 space-y-2 text-[12px] text-amber-800/90">
            <p className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Format DOCX diubah langsung di OOXML.</p>
            <p className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Field TOC dan PAGE dibuat nyata.</p>
            <p className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> File asli disimpan untuk pembatalan.</p>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="keamanan" className="border-t border-line bg-ink-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300">
              <ShieldCheck className="h-3 w-3 text-emerald-400" /> Keamanan & privasi
            </span>
            <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.03em]">
              Dokumen Anda bukan bahan bakar model AI.
            </h2>
            <p className="mt-3 max-w-md text-[13px] leading-relaxed text-slate-300">
              RapiMakalah menyimpan file hanya untuk kebutuhan pemrosesan dan riwayat Anda. Tidak ada penggunaan isi dokumen
              untuk pelatihan, tidak ada URL penyimpanan yang diekspos.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Fingerprint, title: 'Validasi file sebenarnya', text: 'Signature ZIP, struktur OOXML, dan guard dekompresi — bukan hanya ekstensi.' },
              { icon: LockKeyhole, title: 'Kepemilikan ketat', text: 'Setiap endpoint memeriksa pemilik dokumen. File disimpan dengan nama UUID internal.' },
              { icon: MousePointerClick, title: 'Hapus kapan saja', text: 'Hapus dokumen dari riwayat beserta file asli dan hasil pemrosesannya.' },
              { icon: Wand2, title: 'Tanpa data palsu', text: 'Fitur yang belum akurat dijelaskan batasannya. Tidak ada formatting dekoratif.' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <item.icon className="h-4 w-4 text-slate-300" />
                <h3 className="mt-3 text-[12px] font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Panduan */}
      <section id="panduan" className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-brand-700">Panduan</p>
            <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.03em]">Atur sendiri atau biarkan otomatis</h2>
            <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-ink-500">
              Panduan singkat untuk yang ingin memahami aturannya, lengkap dengan angka dan langkah di Microsoft Word.
            </p>
          </div>
          <Link to="/panduan" className="hidden shrink-0 items-center gap-1 text-[13px] font-medium text-brand-700 hover:text-brand-800 sm:inline-flex">
            Semua panduan <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GUIDES.slice(0, 4).map((guide) => (
            <Link
              key={guide.slug}
              to={guide.path}
              className="group flex flex-col rounded-xl border border-line bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-700">{guide.category}</p>
              <h3 className="mt-2 text-[13px] font-semibold leading-snug text-ink-900 group-hover:text-brand-700">{guide.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-ink-500">{guide.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-line bg-slate-50 px-6 py-10 sm:flex-row sm:items-center sm:px-10">
          <div>
            <h2 className="text-[26px] font-semibold tracking-[-0.03em]">Siap merapikan dokumen pertama?</h2>
            <p className="mt-1.5 text-[13px] text-ink-500">Unggah DOCX, pilih template, dan lihat temuannya dalam satu workspace.</p>
          </div>
          <Link
            to={user ? '/app' : '/register'}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            {user ? 'Buka dashboard' : 'Buat akun gratis'} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-[11px] text-ink-400">Academic document formatting platform</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-ink-400">
            <Link to="/galeri" className="hover:text-ink-700">Galeri</Link>
            <Link to="/panduan" className="hover:text-ink-700">Panduan</Link>
            <a
              href="https://whatsapp.com/channel/0029VbD1zGq6mYPUbtVh6U0L"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink-700"
            >
              Channel WhatsApp
            </a>
            <Link to="/login" className="hover:text-ink-700">Masuk</Link>
            <Link to="/register" className="hover:text-ink-700">Daftar</Link>
            <span className="whitespace-nowrap">© {new Date().getFullYear()} RapiMakalah</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function WorkspaceMockup() {
  return (
    <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-2xl border border-line bg-white text-left shadow-[0_24px_80px_-32px_rgba(15,23,42,0.25)]">
      <div className="flex h-8 items-center gap-1.5 border-b border-line bg-slate-50 px-3">
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="ml-2 flex-1 truncate rounded bg-white px-2 py-0.5 text-[9px] text-ink-400">rapimakalah.app/app/documents/makalah-sistem-informasi</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[152px_1fr] lg:grid-cols-[152px_1fr_226px]">
        <div className="hidden border-r border-line bg-white p-3 sm:block">
          <p className="px-1 text-[8px] font-semibold uppercase tracking-wider text-ink-300">Halaman</p>
          <div className="mt-2 space-y-1">
            {['Cover', 'Kata Pengantar', 'Daftar Isi', 'BAB I Pendahuluan', '1.1 Latar Belakang', '1.2 Rumusan Masalah', 'BAB II Tinjauan'].map((item, index) => (
              <div key={item} className={`flex items-center gap-1.5 rounded px-1.5 py-1 text-[8px] ${index === 3 ? 'bg-brand-50 text-brand-700' : 'text-ink-500'}`}>
                <span className="w-2.5 shrink-0 text-right text-[7px] text-ink-300">{index + 1}</span>
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#F6F7F9] p-3 sm:p-5">
          <div className="mx-auto aspect-[1/1.414] w-full max-w-[240px] bg-white px-5 py-5 shadow-[0_2px_12px_rgba(15,23,42,0.12)]">
            <div className="text-center font-serif text-[7px] font-bold leading-tight">ANALISIS SISTEM INFORMASI AKADEMIK</div>
            <div className="mx-auto mt-1 h-[1px] w-14 bg-slate-300" />
            <div className="mt-4 text-center font-serif text-[8px] font-bold">BAB I</div>
            <div className="text-center font-serif text-[9px] font-bold">PENDAHULUAN</div>
            <div className="mt-4 space-y-[3px]">
              {Array.from({ length: 14 }).map((_, index) => (
                <div key={index} className="flex gap-1">
                  <div className={`h-[2px] rounded bg-slate-200 ${index === 0 ? 'ml-2' : ''}`} style={{ width: index % 4 === 0 ? '55%' : '100%' }} />
                  {index % 4 !== 3 && <div className="h-[2px] flex-1 rounded bg-slate-200" />}
                </div>
              ))}
            </div>
            <div className="mt-3 border-l-2 border-amber-400 bg-amber-50 px-1.5 py-1">
              <p className="text-[5.5px] font-medium text-amber-700">Spasi baris 1,0 · seharusnya 1,5</p>
            </div>
            <div className="mt-4 flex justify-center">
              <span className="h-[1px] w-4 bg-slate-300" />
              <span className="mx-1 text-[5px] text-ink-400">1</span>
              <span className="h-[1px] w-4 bg-slate-300" />
            </div>
          </div>
        </div>
        <div className="hidden border-l border-line bg-white p-3 lg:block">
          <div className="flex items-center justify-between">
            <p className="text-[8px] font-semibold text-ink-700">Pemeriksaan</p>
            <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[6px] font-medium text-amber-700">3 temuan</span>
          </div>
          <div className="mt-2.5 rounded-lg border border-line p-2">
            <div className="flex items-center gap-1 text-[7px] font-medium text-ink-700"><CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> Margin halaman</div>
            <p className="mt-0.5 text-[6px] leading-relaxed text-ink-400">4-3-3-3 cm sesuai template.</p>
          </div>
          <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50/60 p-2">
            <div className="flex items-center gap-1 text-[7px] font-medium text-amber-800"><AlertTriangle className="h-2.5 w-2.5" /> Spasi baris</div>
            <p className="mt-0.5 text-[6px] leading-relaxed text-amber-800">1,0× pada 6 paragraf. Template: 1,5×.</p>
          </div>
          <div className="mt-1.5 rounded-lg border border-red-200 bg-red-50/60 p-2">
            <div className="flex items-center gap-1 text-[7px] font-medium text-red-800"><Type className="h-2.5 w-2.5" /> Font tidak konsisten</div>
            <p className="mt-0.5 text-[6px] leading-relaxed text-red-800">Calibri 11 pt ditemukan. Template: Times New Roman.</p>
          </div>
          <div className="mt-3 rounded-lg bg-brand-600 px-2 py-1.5 text-center text-[7px] font-medium text-white">Terapkan formatting</div>
        </div>
      </div>
    </div>
  );
}
