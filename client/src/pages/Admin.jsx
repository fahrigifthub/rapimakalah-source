import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Download,
  Eye,
  FileText,
  HardDrive,
  KeyRound,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Wand2,
} from 'lucide-react';
import { AppShell } from '../components/AppShell.jsx';
import { PageHeader, PageLoader, IconTile } from '../components/ui/Common.jsx';
import { Button, IconButton } from '../components/ui/Button.jsx';
import { Badge, StatusBadge } from '../components/ui/Badge.jsx';
import { Field, Input, Select } from '../components/ui/Form.jsx';
import { Modal, ConfirmDialog } from '../components/ui/Modal.jsx';
import { DocumentPreview } from '../components/DocumentPreview.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { adminApi } from '../lib/api.js';
import { cx, formatBytes, formatDate } from '../lib/format.js';

const TABS = [
  { id: 'analytics', label: 'Analitik', icon: BarChart3 },
  { id: 'users', label: 'Pengguna', icon: Users },
  { id: 'documents', label: 'Dokumen', icon: FileText },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Semua status' },
  { value: 'uploaded', label: 'Belum diproses' },
  { value: 'processing', label: 'Diproses' },
  { value: 'ready', label: 'Siap' },
  { value: 'failed', label: 'Gagal' },
];

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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatDay(date) {
  const [month, day] = (date || '').split('-').slice(1).map(Number);
  if (!month || !day) return '';
  return `${day} ${MONTHS[month - 1]}`;
}

function DailyChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return (
    <div className="surface-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-semibold text-ink-900">Dokumen per hari</h2>
          <p className="mt-0.5 text-[11px] text-ink-500">30 hari terakhir · {total} dokumen</p>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <div className="flex h-40 flex-col justify-between pb-px text-[9px] tabular-nums leading-none text-ink-400" aria-hidden="true">
          <span>{max}</span>
          <span>{Math.round(max / 2)}</span>
          <span>0</span>
        </div>
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden="true">
            {[0, 1, 2].map((line) => (
              <div key={line} className="border-t border-dashed border-slate-200" />
            ))}
          </div>
          <div className="relative flex h-40 items-stretch gap-[3px]" role="img" aria-label={`Grafik dokumen per hari, total ${total} dokumen dalam 30 hari, puncak ${max} dokumen`}>
            {data.map((day) => {
              const height = Math.max(day.count > 0 ? 3 : 1.2, (day.count / max) * 100);
              return (
                <div key={day.date} className="group relative flex flex-1 items-end">
                  <div className="relative w-full" style={{ height: `${height}%` }}>
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-[10px] font-medium text-white group-hover:block">
                      {formatDay(day.date)} · {day.count}
                    </span>
                    <div
                      className={cx(
                        'h-full w-full rounded-t-sm transition-colors',
                        day.count > 0 ? 'bg-brand-500 group-hover:bg-brand-600' : 'bg-slate-200',
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] tabular-nums text-ink-400">
            <span>{formatDay(data[0]?.date)}</span>
            <span>{formatDay(data[Math.floor((data.length - 1) / 2)]?.date)}</span>
            <span>{formatDay(data[data.length - 1]?.date)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateUsage({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="surface-card p-5">
      <h2 className="text-[13px] font-semibold text-ink-900">Template terpakai</h2>
      <p className="mt-0.5 text-[11px] text-ink-500">Berdasarkan dokumen yang pernah diformat</p>
      {rows.length === 0 ? (
        <p className="mt-6 text-[12px] text-ink-500">Belum ada dokumen.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.name}>
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <span className="truncate font-medium text-ink-800">{row.name}</span>
                <span className="shrink-0 tabular-nums text-ink-500">{row.count}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.round((row.count / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AnalyticsTab() {
  const { error } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const data = await adminApi.getStats();
        setStats(data);
      } catch (err) {
        error(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [error],
  );

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader label="Menghitung statistik…" />;
  if (!stats) return null;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" icon={RefreshCw} loading={refreshing} onClick={() => load(true)}>
          Muat ulang
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Pengguna" value={stats.totalUsers} hint="Akun terdaftar" tone="blue" />
        <StatCard icon={FileText} label="Dokumen" value={stats.totalDocs} hint="Total unggahan dan dokumen teks" tone="amber" />
        <StatCard icon={Wand2} label="Sudah diformat" value={stats.processedDocs} hint="Memiliki hasil DOCX" tone="green" />
        <StatCard icon={HardDrive} label="Penyimpanan" value={formatBytes(stats.storageBytes)} hint="Asli + hasil" tone="amber" />
      </div>
      {stats.errorDocs > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <p className="text-[12px] leading-relaxed text-amber-900">
            {stats.errorDocs} dokumen berstatus gagal diproses. Periksa log server bila jumlahnya bertambah.
          </p>
        </div>
      )}
      <div className="grid items-start gap-5 xl:grid-cols-[1.6fr_1fr]">
        <DailyChart data={stats.docsPerDay} />
        <TemplateUsage rows={stats.templates} />
      </div>
    </div>
  );
}

function ResetPasswordModal({ target, onClose }) {
  const [password, setPassword] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!target) {
      setPassword(null);
      setCopied(false);
      return;
    }
    let active = true;
    setLoading(true);
    setPassword(null);
    adminApi
      .resetPassword(target.id)
      .then((res) => {
        if (active) setPassword(res.newPassword);
      })
      .catch((err) => {
        if (active) setPassword(`Gagal: ${err.message}`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [target]);

  const copy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Modal
      open={Boolean(target)}
      onClose={onClose}
      title="Password baru"
      description={target ? `Password untuk ${target.email} telah direset.` : ''}
      size="sm"
      footer={<Button variant="secondary" onClick={onClose}>Tutup</Button>}
    >
      {loading ? (
        <p className="text-sm text-ink-600">Membuat password baru…</p>
      ) : password ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-slate-50 px-4 py-3 text-center">
            <code className="select-all font-mono text-[18px] font-semibold tracking-[0.08em] text-ink-900">{password}</code>
          </div>
          <p className="text-[12px] leading-relaxed text-ink-600">
            Salin sekarang dan kirim ke pengguna. Password tidak bisa dilihat lagi setelah dialog ditutup.
          </p>
          <Button size="sm" icon={KeyRound} onClick={copy} variant={copied ? 'secondary' : 'primary'}>
            {copied ? 'Tersalin' : 'Salin password'}
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}

function UsersTab() {
  const { error, success } = useToast();
  const [data, setData] = useState({ users: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [resetTarget, setResetTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: String(page) };
      if (query.trim()) params.search = query.trim();
      const payload = await adminApi.getUsers(params);
      setData(payload);
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, query, error]);

  useEffect(() => {
    load();
  }, [load]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setQuery(search);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteUser(deleteTarget.id);
      success('Akun dihapus', { description: `${deleteTarget.email} beserta dokumennya telah dihapus.` });
      setDeleteTarget(null);
      load();
    } catch (err) {
      error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submitSearch} className="flex flex-wrap items-end gap-2">
        <Field label="Cari pengguna" className="min-w-[220px] flex-1 sm:max-w-xs">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nama atau email"
            type="search"
          />
        </Field>
        <Button type="submit" variant="secondary" size="md" icon={Search}>Cari</Button>
      </form>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[12px]">
            <thead>
              <tr className="border-b border-line bg-slate-50/70 text-[11px] uppercase tracking-[0.05em] text-ink-500">
                <th scope="col" className="px-4 py-2.5 font-semibold">Pengguna</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Peran</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Dokumen</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Terdaftar</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-500">Memuat pengguna…</td>
                </tr>
              ) : data.users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-500">Tidak ada pengguna yang cocok.</td>
                </tr>
              ) : (
                data.users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{u.name}</p>
                      <p className="mt-0.5 text-[11px] text-ink-500">{u.email}</p>
                      {(u.institution || u.programStudy) && (
                        <p className="mt-0.5 text-[11px] text-ink-400">{[u.programStudy, u.institution].filter(Boolean).join(' · ')}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={u.role === 'admin' ? 'blue' : 'slate'} dot>
                        {u.role === 'admin' ? 'Admin' : 'Pengguna'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink-700">{u._count.documents}</td>
                    <td className="px-4 py-3 text-ink-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          label={`Reset password ${u.email}`}
                          disabled={u.role === 'admin'}
                          onClick={() => setResetTarget(u)}
                        >
                          <KeyRound className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label={`Hapus akun ${u.email}`}
                          disabled={u.role === 'admin'}
                          className="hover:bg-red-50 hover:text-red-700"
                          onClick={() => setDeleteTarget(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-[11px] text-ink-500">
          <span>{data.total} pengguna</span>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              Sebelumnya
            </Button>
            <span className="tabular-nums">{data.page} / {data.totalPages || 1}</span>
            <Button variant="ghost" size="sm" disabled={page >= (data.totalPages || 1) || loading} onClick={() => setPage((p) => p + 1)}>
              Berikutnya
            </Button>
          </div>
        </div>
      </div>

      <ResetPasswordModal target={resetTarget} onClose={() => setResetTarget(null)} />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Hapus akun pengguna?"
        description={
          deleteTarget
            ? `${deleteTarget.name} (${deleteTarget.email}) beserta ${deleteTarget._count.documents} dokumen dan templatenya akan dihapus permanen.`
            : ''
        }
        confirmLabel="Hapus akun"
      />
    </div>
  );
}

function DocumentPreviewModal({ target, onClose }) {
  const { error } = useToast();
  const [state, setState] = useState({ loading: false, preview: null, config: null, document: null, variant: 'processed' });
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    if (!target) return undefined;
    let active = true;
    setState({ loading: true, preview: null, config: null, document: null, variant: target.variant });
    setPageIndex(0);
    adminApi
      .getDocumentPreview(target.id, target.variant)
      .then((payload) => {
        if (active) setState({ loading: false, preview: payload.preview, config: payload.config, document: payload.document, variant: target.variant });
      })
      .catch((err) => {
        if (!active) return;
        setState({ loading: false, preview: null, config: null, document: null, variant: target.variant });
        error(err.message);
      });
    return () => {
      active = false;
    };
  }, [target, error]);

  const totalPages = state.preview?.pages?.length || 0;

  return (
    <Modal
      open={Boolean(target)}
      onClose={onClose}
      title={target?.originalName || 'Pratinjau dokumen'}
      description={
        target
          ? `${target.owner?.email || ''} · pratinjau ${target.variant === 'processed' ? 'hasil formatting' : 'file asli'}`
          : ''
      }
      size="lg"
      footer={
        state.preview ? (
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                disabled={pageIndex <= 0}
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              >
                Sebelumnya
              </Button>
              <span className="text-[11px] tabular-nums text-ink-500">
                {pageIndex + 1} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={pageIndex >= totalPages - 1}
                onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              >
                Berikutnya
              </Button>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="secondary" icon={Download} onClick={() => target && adminApi.downloadDocument(target.id, 'original').catch((err) => error(err.message))}>
                Asli
              </Button>
              <Button
                size="sm"
                icon={Download}
                disabled={!target?.hasProcessed}
                onClick={() => target && adminApi.downloadDocument(target.id, 'processed').catch((err) => error(err.message))}
              >
                Hasil formatting
              </Button>
            </div>
          </div>
        ) : null
      }
    >
      {state.loading ? (
        <p className="py-10 text-center text-[12px] text-ink-500">Menyiapkan pratinjau…</p>
      ) : state.preview ? (
        <div className="flex justify-center overflow-x-auto rounded-xl bg-slate-100 p-3">
          <DocumentPreview preview={state.preview} pageIndex={pageIndex} zoom={0.72} config={state.config} />
        </div>
      ) : (
        <p className="py-10 text-center text-[12px] text-ink-500">Pratinjau tidak tersedia.</p>
      )}
    </Modal>
  );
}

function DocumentsTab() {
  const { error } = useToast();
  const [data, setData] = useState({ documents: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [previewTarget, setPreviewTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: String(page) };
      if (query.trim()) params.q = query.trim();
      if (status) params.status = status;
      const payload = await adminApi.getDocuments(params);
      setData(payload);
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, query, status, error]);

  useEffect(() => {
    load();
  }, [load]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setQuery(search);
  };

  const openPreview = (doc, variant) => {
    if (variant === 'processed' && !doc.hasProcessed) return;
    setPreviewTarget({ ...doc, variant });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submitSearch} className="flex flex-wrap items-end gap-2">
        <Field label="Cari dokumen" className="min-w-[220px] flex-1 sm:max-w-xs">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nama file, nama, atau email pemilik"
            type="search"
          />
        </Field>
        <Field label="Status" className="w-[190px]">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </Field>
        <Button type="submit" variant="secondary" size="md" icon={Search}>Cari</Button>
      </form>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-[12px]">
            <thead>
              <tr className="border-b border-line bg-slate-50/70 text-[11px] uppercase tracking-[0.05em] text-ink-500">
                <th scope="col" className="px-4 py-2.5 font-semibold">Dokumen</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Pemilik</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Status</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Ukuran</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Dibuat</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-500">Memuat dokumen…</td>
                </tr>
              ) : data.documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-500">Tidak ada dokumen yang cocok.</td>
                </tr>
              ) : (
                data.documents.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60">
                    <td className="max-w-[320px] px-4 py-3">
                      <p className="truncate font-medium text-ink-900" title={d.originalName}>{d.originalName}</p>
                      <p className="mt-0.5 text-[11px] text-ink-500">
                        {d.templateName || 'Tanpa template'}
                        {d.pageCount ? ` · ${d.pageCount} halaman` : ''}
                      </p>
                      {d.status === 'failed' && d.errorMessage ? (
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-red-600">{d.errorMessage}</p>
                      ) : null}
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <p className="truncate text-ink-800" title={d.owner?.name}>{d.owner?.name || '—'}</p>
                      <p className="mt-0.5 truncate text-[11px] text-ink-500" title={d.owner?.email}>{d.owner?.email}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-3 tabular-nums text-ink-600">
                      {formatBytes(d.size)}
                      {d.processedSize ? <span className="block text-[10px] text-ink-400">hasil {formatBytes(d.processedSize)}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-ink-500">{formatDate(d.createdAt, { withTime: true })}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton label={`Pratinjau asli ${d.originalName}`} onClick={() => openPreview(d, 'original')}>
                          <Eye className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label={`Pratinjau hasil ${d.originalName}`}
                          disabled={!d.hasProcessed}
                          onClick={() => openPreview(d, 'processed')}
                        >
                          <Wand2 className="h-4 w-4" />
                        </IconButton>
                         <IconButton
                           label={`Unduh hasil ${d.originalName}`}
                          disabled={!d.hasProcessed}
                          onClick={() => adminApi.downloadDocument(d.id, 'processed').catch((err) => error(err.message))}
                         >
                           <Download className="h-4 w-4" />
                         </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-[11px] text-ink-500">
          <span>{data.total} dokumen</span>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              Sebelumnya
            </Button>
            <span className="tabular-nums">{data.page} / {data.totalPages || 1}</span>
            <Button variant="ghost" size="sm" disabled={page >= (data.totalPages || 1) || loading} onClick={() => setPage((p) => p + 1)}>
              Berikutnya
            </Button>
          </div>
        </div>
      </div>

      <DocumentPreviewModal target={previewTarget} onClose={() => setPreviewTarget(null)} />
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState('analytics');

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administrator"
        title="Admin panel"
        description="Statistik penggunaan, dokumen pengguna, dan pengelolaan akun."
      />
      <div className="mb-5 flex gap-1 rounded-xl border border-line bg-white p-1" role="tablist" aria-label="Bagian admin">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cx(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition sm:flex-none sm:px-4',
              tab === item.id ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-slate-50 hover:text-ink-800',
            )}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'analytics' ? <AnalyticsTab /> : tab === 'users' ? <UsersTab /> : <DocumentsTab />}
    </AppShell>
  );
}
