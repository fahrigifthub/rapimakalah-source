import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Copy, LayoutTemplate, LogIn, UserRound } from 'lucide-react';
import { PublicShell } from '../components/PublicShell.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Spinner } from '../components/ui/Common.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { ALIGNMENT_LABELS, PAGE_NUMBER_LABELS, PAGE_NUMBER_POSITIONS, configSummary } from '../lib/templateConfig.js';
import { useDocumentMeta } from '../lib/useDocumentMeta.js';

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-[12px] text-ink-500">{label}</span>
      <span className="text-right text-[12px] font-medium text-ink-900">{value}</span>
    </div>
  );
}

export default function SharedTemplate() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { success, error } = useToast();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [importing, setImporting] = useState(false);

  useDocumentMeta({
    title: template ? `${template.name} — Template dibagikan · RapiMakalah` : 'Template dibagikan — RapiMakalah',
    description: 'Lihat dan simpan template format makalah yang dibagikan lewat RapiMakalah.',
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get(`/share/${shareId}`)
      .then((payload) => {
        if (active) setTemplate(payload.template);
      })
      .catch((err) => {
        if (active) setLoadError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [shareId]);

  const handleImport = async () => {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/t/${shareId}`)}`);
      return;
    }
    setImporting(true);
    try {
      const payload = await api.post(`/share/${shareId}/import`);
      success('Template disimpan', { description: `“${payload.template.name}” sekarang ada di akun Anda.` });
      navigate(`/app/templates/${payload.template.id}`);
    } catch (err) {
      error(err.message);
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <PublicShell>
        <div className="flex min-h-[50vh] items-center justify-center gap-2 text-[13px] text-ink-500">
          <Spinner /> Memuat template…
        </div>
      </PublicShell>
    );
  }

  if (loadError || !template) {
    return (
      <PublicShell>
        <section className="mx-auto max-w-xl px-5 py-20 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-[22px] font-semibold tracking-[-0.02em]">Tautan template tidak tersedia</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
            {loadError || 'Tautan ini mungkin salah, atau pemiliknya sudah mencabut akses berbagi.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => navigate('/app/templates')} icon={LayoutTemplate}>
              Ke template saya
            </Button>
            <Button variant="secondary" onClick={() => navigate('/panduan')}>
              Lihat panduan format
            </Button>
          </div>
        </section>
      </PublicShell>
    );
  }

  const config = template.config;
  const margins = config.page.margins;
  const summary = configSummary(config);

  return (
    <PublicShell>
      <section className="border-b border-line bg-[#FBFCFE]">
        <div className="mx-auto max-w-4xl px-5 pb-10 pt-12">
          <nav aria-label="Breadcrumb" className="text-[11px] text-ink-400">
            <Link to="/" className="hover:text-ink-700">Beranda</Link>
            <span className="mx-1.5">/</span>
            <span className="text-ink-600">Template dibagikan</span>
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone="blue">{template.category}</Badge>
            <Badge tone="slate">Template dibagikan</Badge>
          </div>

          <h1 className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.03em] sm:text-[34px]">
            {template.name}
          </h1>
          {template.description && (
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-600">{template.description}</p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5" />
              Dibagikan oleh <strong className="font-medium text-ink-800">{template.ownerName}</strong>
            </span>
            {template.ownerInstitution && <span>{template.ownerInstitution}</span>}
            {template.ownerProgramStudy && <span>{template.ownerProgramStudy}</span>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-10">
        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <div className="surface-card p-5">
            <h2 className="text-[13px] font-semibold text-ink-900">Isi template</h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-500">
              Semua pengaturan di bawah disalin apa adanya saat Anda menyimpannya.
            </p>
            <div className="mt-3">
              <Row label="Ukuran halaman" value={`${config.page.size} · ${config.page.orientation === 'landscape' ? 'landscape' : 'portrait'}`} />
              <Row label="Margin (atas/kanan/bawah/kiri)" value={`${margins.top} / ${margins.right} / ${margins.bottom} / ${margins.left} cm`} />
              <Row label="Font badan teks" value={`${config.typography.fontFamily} ${config.typography.fontSize} pt`} />
              <Row label="Spasi baris" value={`${config.typography.lineSpacing}×`} />
              <Row label="Indent baris pertama" value={`${config.typography.firstLineIndent} cm`} />
              <Row label="Perataan" value={ALIGNMENT_LABELS[config.typography.alignment] || config.typography.alignment} />
              <Row
                label="Heading"
                value={`BAB ${config.headings.chapter.fontSize} pt · Sub ${config.headings.subheading.fontSize} pt · Sub-sub ${config.headings.subsubheading.fontSize} pt`}
              />
              <Row
                label="Penomoran halaman"
                value={`${PAGE_NUMBER_LABELS[config.pageNumbering.frontMatter] || '—'} → ${PAGE_NUMBER_LABELS[config.pageNumbering.body] || '—'} · ${PAGE_NUMBER_POSITIONS[config.pageNumbering.position] || config.pageNumbering.position}`}
              />
              <Row
                label="Daftar isi"
                value={config.toc.enabled ? `${config.toc.title} · kedalaman ${config.toc.depth}` : 'Tidak dibuat'}
              />
              <Row
                label="Daftar pustaka"
                value={`${config.bibliography.alignment === 'justify' ? 'Justify' : config.bibliography.alignment} · hanging ${config.bibliography.hangingIndent} cm`}
              />
            </div>
          </div>

          <aside className="space-y-3">
            <div className="surface-card p-5">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-[11.5px] leading-relaxed text-ink-600">
                  Salinan ini <strong className="font-semibold text-ink-900">milik Anda</strong>. Setelah disimpan, Anda bebas
                  mengubahnya tanpa memengaruhi template asli pemiliknya.
                </p>
              </div>

              {authLoading ? (
                <div className="mt-4 flex items-center gap-2 text-[12px] text-ink-400">
                  <Spinner /> Memeriksa sesi…
                </div>
              ) : user ? (
                <Button className="mt-4 w-full" onClick={handleImport} loading={importing} icon={Copy}>
                  Simpan ke akun saya
                </Button>
              ) : (
                <div className="mt-4 space-y-2">
                  <Button className="w-full" onClick={handleImport} icon={LogIn}>
                    Masuk untuk menyimpan
                  </Button>
                  <Link
                    to={`/register?next=${encodeURIComponent(`/t/${shareId}`)}`}
                    className="flex h-9 items-center justify-center gap-1 text-[12px] font-medium text-brand-700 hover:text-brand-800"
                  >
                    Belum punya akun? Daftar gratis <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">Ringkasan cepat</p>
              <ul className="mt-2 space-y-1.5 text-[11.5px] leading-relaxed text-ink-600">
                {summary.map((line) => (
                  <li key={line} className="flex gap-1.5">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </PublicShell>
  );
}
