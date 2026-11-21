import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  Layers,
  LayoutTemplate,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  Wand2,
} from 'lucide-react';
import { AppShell } from '../components/AppShell.jsx';
import { UploadZone } from '../components/UploadZone.jsx';
import { PageHeader, PageLoader, SectionTitle, EmptyState, IconTile } from '../components/ui/Common.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { formatBytes, formatDate, relativeTime } from '../lib/format.js';

const ACTIVITY_ICONS = {
  upload: UploadCloud,
  format: Wand2,
  delete: Trash2,
  template: LayoutTemplate,
  auth: ShieldCheck,
  check: FileText,
};

function StatCard({ icon: Icon, label, value, hint, tone = 'blue' }) {
  return (
    <div className="surface-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-400">{label}</p>
          <p className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.03em] text-ink-900">{value}</p>
        </div>
        <IconTile icon={Icon} tone={tone} />
      </div>
      <p className="mt-2.5 text-[11px] leading-relaxed text-ink-500">{hint}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="surface-card h-[108px] p-4">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton mt-4 h-7 w-16" />
            <div className="skeleton mt-3 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="surface-card h-80 p-5"><div className="skeleton h-4 w-40" /><div className="skeleton mt-5 h-52 w-full" /></div>
        <div className="surface-card h-80 p-5"><div className="skeleton h-4 w-32" /><div className="skeleton mt-5 h-52 w-full" /></div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get('/dashboard')
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch((err) => error(err.message))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [error]);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 19) return 'Selamat sore';
    return 'Selamat malam';
  })();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Dashboard"
        title={`${greeting}, ${user?.name?.split(' ')[0] || 'mahasiswa'}.`}
        description="Lihat dokumen terakhir, temuan format, dan template yang paling sering Anda gunakan."
        actions={
          <>
            <Button variant="secondary" icon={LayoutTemplate} onClick={() => navigate('/app/templates')}>
              Template
            </Button>
            <Button icon={UploadCloud} onClick={() => navigate('/app/documents/new')}>
              Upload dokumen
            </Button>
          </>
        }
      />

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={FileText}
              label="Total dokumen"
              value={data?.stats.totalDocuments ?? 0}
              hint={`${data?.stats.readyDocuments ?? 0} dokumen sudah memiliki hasil formatting`}
            />
            <StatCard
              icon={CheckCircle2}
              label="Selesai dirapikan"
              value={data?.stats.readyDocuments ?? 0}
              hint="File hasil tersimpan dan bisa diunduh ulang"
              tone="green"
            />
            <StatCard
              icon={Layers}
              label="Total halaman"
              value={data?.stats.totalPages || '—'}
              hint={`${(data?.stats.totalWords || 0).toLocaleString('id-ID')} kata terindeks dari dokumen`}
              tone="amber"
            />
            <StatCard
              icon={Sparkles}
              label="Rata-rata temuan"
              value={data?.stats.issueCount ?? data?.stats.averageIssues ?? 0}
              hint="Temuan format pada analisis terakhir per dokumen"
              tone="slate"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
            <div className="space-y-5">
              <section className="surface-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <SectionTitle title="Dokumen terakhir" description="Lanjutkan workspace atau unduh hasil yang sudah ada." />
                  <Link to="/app/documents" className="text-[12px] font-medium text-brand-600 hover:text-brand-700">
                    Lihat semua
                  </Link>
                </div>
                {data?.recentDocuments?.length ? (
                  <div className="divide-y divide-line">
                    {data.recentDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50/60">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink-400">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <Link to={`/app/documents/${doc.id}`} className="block truncate text-[13px] font-medium text-ink-900 hover:text-brand-700">
                            {doc.originalName}
                          </Link>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-500">
                            <span>{formatBytes(doc.size)}</span>
                            <span className="text-ink-300">·</span>
                            <span>{doc.templateName || 'Tanpa template'}</span>
                            <span className="text-ink-300">·</span>
                            <span>{relativeTime(doc.createdAt)}</span>
                          </p>
                        </div>
                        <div className="hidden sm:block">
                          <StatusBadge status={doc.status} />
                        </div>
                        {doc.issueCount !== null && doc.issueCount !== undefined && (
                          <span className="hidden rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 sm:inline">
                            {doc.issueCount} temuan
                          </span>
                        )}
                        <Link
                          to={`/app/documents/${doc.id}`}
                          className="rounded-lg p-1.5 text-ink-400 transition hover:bg-white hover:text-brand-600"
                          aria-label={`Buka ${doc.originalName}`}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    className="m-5 border-0 bg-slate-50/50 py-10"
                    icon={FileText}
                    title="Belum ada dokumen"
                    description="Unggah DOCX pertama Anda untuk melihat analisis format dan menerapkan perbaikan."
                  />
                )}
              </section>

              <section className="surface-card p-5">
                <SectionTitle title="Aktivitas terbaru" description="Jejak unggahan, formatting, dan perubahan template." />
                <div className="mt-4 space-y-1">
                  {data?.activities?.length ? (
                    data.activities.map((activity) => {
                      const Icon = ACTIVITY_ICONS[activity.type] || FileText;
                      return (
                        <div key={activity.id} className="flex items-start gap-3 rounded-lg px-1 py-2">
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-ink-400">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] leading-snug text-ink-700">{activity.message}</p>
                            <p className="mt-0.5 text-[10px] text-ink-400">{formatDate(activity.createdAt, { withTime: true })}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="py-4 text-center text-[12px] text-ink-400">Aktivitas akan muncul setelah Anda mulai menggunakan RapiMakalah.</p>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="surface-card p-5">
                <SectionTitle title="Mulai cepat" description="Unggah DOCX baru langsung dari dashboard." />
                <UploadZone
                  compact
                  className="mt-3"
                  onUploaded={(doc) => {
                    success('Dokumen berhasil diunggah', { description: 'Memilih template dan menganalisis format…' });
                    navigate(`/app/documents/${doc.id}`);
                  }}
                  onError={(message) => error(message)}
                />
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <p className="text-[11px] leading-relaxed text-ink-500">
                    File divalidasi dari signature dan struktur OOXML-nya, bukan hanya ekstensi.
                  </p>
                </div>
              </section>

              <section className="surface-card p-5">
                <div className="flex items-center justify-between">
                  <SectionTitle title="Template sering dipakai" />
                  <Link to="/app/templates" className="text-[11px] font-medium text-brand-600 hover:text-brand-700">
                    Kelola
                  </Link>
                </div>
                <div className="mt-3 space-y-1.5">
                  {data?.templateUsage?.length ? (
                    data.templateUsage.map((template) => (
                      <Link
                        key={template.id}
                        to={`/app/templates/${template.id}`}
                        className="flex items-center justify-between rounded-lg border border-transparent px-2 py-2 transition hover:border-line hover:bg-slate-50"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <IconTile icon={LayoutTemplate} tone="slate" className="h-7 w-7" />
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-medium text-ink-800">{template.name}</p>
                            <p className="text-[10px] text-ink-400">{template.category}</p>
                          </div>
                        </div>
                        <span className="shrink-0 text-[11px] tabular-nums text-ink-400">{template.count}×</span>
                      </Link>
                    ))
                  ) : (
                    <p className="py-3 text-[12px] leading-relaxed text-ink-400">
                      Belum ada template yang dipakai. Pilih template saat memproses dokumen.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-line bg-white p-5">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-800">
                  <Clock3 className="h-3.5 w-3.5 text-ink-400" /> Pengingat
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-ink-500">
                  Preview RapiMakalah adalah render struktural. Selalu buka file hasil di Microsoft Word untuk memeriksa
                  pagination, field daftar isi, dan tampilan akhir.
                </p>
                <Link to="/app/documents" className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700">
                  Buka riwayat dokumen <ArrowUpRight className="h-3 w-3" />
                </Link>
              </section>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
