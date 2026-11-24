import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, CalendarDays, Copy, LayoutTemplate, Search, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { PublicShell } from '../components/PublicShell.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState, Spinner } from '../components/ui/Common.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { TemplatePreview } from '../components/TemplatePreview.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { cx, formatDate } from '../lib/format.js';
import { configSummary } from '../lib/templateConfig.js';
import { useDocumentMeta } from '../lib/useDocumentMeta.js';

function GalleryCard({ template, onOpen }) {
  const summary = configSummary(template.config).slice(0, 4);
  return (
    <article className="surface-card flex flex-col overflow-hidden transition hover:shadow-pop">
      <div className="relative border-b border-line bg-gradient-to-b from-slate-50/80 to-white p-3">
        <div className="absolute left-3 top-3 z-10">
          <Badge tone="blue">{template.category}</Badge>
        </div>
        <TemplatePreview config={template.config} className="h-[176px] border-0 bg-transparent p-0" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="text-[14px] font-semibold leading-snug text-ink-900">{template.name}</h2>
        <p className="mt-2 line-clamp-2 min-h-[2.4em] text-[12px] leading-relaxed text-ink-500">
          {template.description || 'Template komunitas tanpa deskripsi.'}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="h-3 w-3" />
            {template.ownerName}
          </span>
          {template.publishedAt && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" />
              {formatDate(template.publishedAt)}
            </span>
          )}
        </div>
        <ul className="mt-3 flex flex-1 flex-wrap content-start gap-1.5">
          {summary.map((item) => (
            <li key={item} className="rounded-md border border-line bg-white px-1.5 py-1 text-[10px] text-ink-500">
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-line pt-3">
          <Button size="sm" icon={ArrowRight} className="w-full justify-center" onClick={() => onOpen(template)}>
            Lihat &amp; pakai
          </Button>
        </div>
      </div>
    </article>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-[12px] text-ink-500">{label}</span>
      <span className="text-right text-[12px] font-medium text-ink-900">{value}</span>
    </div>
  );
}

export default function Gallery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState(null);
  const [copying, setCopying] = useState(false);

  useDocumentMeta({
    title: 'Galeri Template Makalah — RapiMakalah',
    description:
      'Jelajahi template format makalah dan skripsi yang dibagikan komunitas RapiMakalah, lalu simpan salinannya ke akun Anda.',
  });

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (category) params.set('category', category);
      api
        .get(`/gallery${params.toString() ? `?${params}` : ''}`, { cache: 'no-store' })
        .then((payload) => {
          if (!active) return;
          setTemplates(payload.templates || []);
          setCategories(payload.categories || []);
          setLoadError('');
        })
        .catch((err) => {
          if (active) setLoadError(err.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, query ? 250 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, category]);

  const summary = useMemo(() => (selected ? configSummary(selected.config) : []), [selected]);

  const handleUse = async () => {
    if (!selected) return;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent('/galeri')}`);
      return;
    }
    setCopying(true);
    try {
      const payload = await api.post(`/gallery/${selected.id}/use`);
      success('Template disimpan', { description: `“${payload.template.name}” sekarang ada di akun Anda.` });
      setSelected(null);
      navigate(`/app/templates/${payload.template.id}`);
    } catch (err) {
      error(err.message);
      setCopying(false);
    }
  };

  return (
    <PublicShell>
      <section className="border-b border-line bg-[#FBFCFE]">
        <div className="mx-auto max-w-5xl px-5 pb-10 pt-12">
          <Badge tone="blue">
            <Sparkles className="h-3 w-3" />
            Galeri komunitas
          </Badge>
          <h1 className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.03em] sm:text-[34px]">
            Template makalah dari pengguna lain
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-600">
            Template di sini diterbitkan langsung oleh pemiliknya. Lihat pengaturan formatnya, lalu simpan salinan
            pribadi yang bisa Anda ubah tanpa memengaruhi template asli.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama atau kategori…"
              className="field-input h-9 pl-9 text-[12px]"
              aria-label="Cari template galeri"
            />
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCategory('')}
                className={cx(
                  'rounded-full border px-2.5 py-1 text-[11px] font-medium transition',
                  category === '' ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-line bg-white text-ink-500 hover:text-ink-900',
                )}
              >
                Semua
              </button>
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item === category ? '' : item)}
                  className={cx(
                    'rounded-full border px-2.5 py-1 text-[11px] font-medium transition',
                    category === item ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-line bg-white text-ink-500 hover:text-ink-900',
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-line bg-white px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-[11px] leading-relaxed text-ink-500">
            Template komunitas adalah titik awal, bukan pedoman resmi kampus Anda. Selalu cocokkan margin, font, dan
            penomoran dengan panduan institusi sebelum mengumpulkan dokumen.
          </p>
        </div>

        {loadError ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] leading-relaxed text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {loadError}
          </div>
        ) : loading ? (
          <div className="flex min-h-[220px] items-center justify-center gap-2 text-[13px] text-ink-500">
            <Spinner /> Memuat galeri…
          </div>
        ) : templates.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <GalleryCard key={template.id} template={template} onOpen={setSelected} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={LayoutTemplate}
            title={query || category ? 'Template tidak ditemukan' : 'Galeri masih kosong'}
            description={
              query || category
                ? 'Coba kata kunci atau kategori lain.'
                : 'Belum ada pengguna yang menerbitkan template. Jadilah yang pertama dari halaman Template.'
            }
            action={
              <Button variant="secondary" onClick={() => navigate(user ? '/app/templates' : '/register')} icon={LayoutTemplate}>
                {user ? 'Ke template saya' : 'Mulai gratis'}
              </Button>
            }
          />
        )}
      </section>

      <Modal
        open={Boolean(selected)}
        onClose={() => (copying ? null : setSelected(null))}
        title={selected ? selected.name : ''}
        description={selected ? selected.description || 'Template komunitas.' : ''}
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-slate-50/60 p-3">
              <TemplatePreview config={selected.config} className="h-[230px] border-0 bg-transparent p-0" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="blue">{selected.category}</Badge>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-500">
                <UserRound className="h-3 w-3" /> {selected.ownerName}
              </span>
              {selected.ownerInstitution && <span className="text-[11px] text-ink-500">· {selected.ownerInstitution}</span>}
            </div>

            <div>
              <DetailRow label="Ukuran halaman" value={`${selected.config.page.size} · ${selected.config.page.margins.top} / ${selected.config.page.margins.right} / ${selected.config.page.margins.bottom} / ${selected.config.page.margins.left} cm`} />
              <DetailRow label="Font badan teks" value={`${selected.config.typography.fontFamily} ${selected.config.typography.fontSize} pt`} />
              <DetailRow label="Spasi baris" value={`${selected.config.typography.lineSpacing}×`} />
              <DetailRow label="Daftar isi" value={selected.config.toc.enabled ? `${selected.config.toc.title} · kedalaman ${selected.config.toc.depth}` : 'Tidak dibuat'} />
            </div>

            <ul className="space-y-1.5 text-[11.5px] leading-relaxed text-ink-500">
              {summary.slice(0, 5).map((line) => (
                <li key={line} className="flex gap-1.5">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                  {line}
                </li>
              ))}
            </ul>

            <Button className="w-full justify-center" icon={user ? Copy : ArrowRight} onClick={handleUse} loading={copying}>
              {user ? 'Simpan salinan ke akun saya' : 'Masuk untuk memakai template'}
            </Button>
            {!user && (
              <p className="text-center text-[11px] text-ink-400">
                Belum punya akun?{' '}
                <button
                  type="button"
                  className="font-medium text-brand-700 hover:text-brand-800"
                  onClick={() => navigate('/register?next=/galeri')}
                >
                  Daftar gratis
                </button>
              </p>
            )}
          </div>
        )}
      </Modal>
    </PublicShell>
  );
}
