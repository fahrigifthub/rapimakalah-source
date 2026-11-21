import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Files,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { AppShell } from '../components/AppShell.jsx';
import { PageHeader, PageLoader, EmptyState } from '../components/ui/Common.jsx';
import { Button, IconButton } from '../components/ui/Button.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { Select } from '../components/ui/Form.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, downloadFile } from '../lib/api.js';
import { cx, formatBytes, formatDate } from '../lib/format.js';

const STATUS_FILTERS = [
  { value: '', label: 'Semua status' },
  { value: 'uploaded', label: 'Belum diproses' },
  { value: 'ready', label: 'Siap diunduh' },
  { value: 'failed', label: 'Gagal' },
];

const PAGE_SIZE = 10;

function SkeletonRows() {
  return (
    <div className="divide-y divide-line">
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="flex items-center gap-3 px-5 py-4">
          <div className="skeleton h-9 w-9 rounded-lg" />
          <div className="min-w-0 flex-1">
            <div className="skeleton h-3 w-2/5" />
            <div className="skeleton mt-2 h-2.5 w-1/4" />
          </div>
          <div className="skeleton hidden h-5 w-20 rounded-full sm:block" />
          <div className="skeleton h-7 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function DocumentRow({ doc, onDelete, onDownload, downloading }) {
  const processedName = doc.processedName
    ? `${(doc.originalName || 'dokumen').replace(/\.docx$/i, '')}-rapimakalah.docx`
    : null;

  return (
    <div className="grid grid-cols-1 gap-3 px-4 py-4 transition hover:bg-slate-50/60 sm:px-5 md:grid-cols-[minmax(0,1fr)_140px_112px_92px] md:items-center md:gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink-400">
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <Link
            to={`/app/documents/${doc.id}`}
            className="block truncate text-[13px] font-medium text-ink-900 transition hover:text-brand-700"
            title={doc.originalName}
          >
            {doc.originalName}
          </Link>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-500">
            <span>{formatBytes(doc.size)}</span>
            <span className="text-ink-300">·</span>
            <span>{formatDate(doc.createdAt)}</span>
            {doc.pageCount ? (
              <>
                <span className="text-ink-300">·</span>
                <span>± {doc.pageCount} halaman</span>
              </>
            ) : null}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 md:hidden">
            <StatusBadge status={doc.status} />
            {doc.issueCount !== null && doc.issueCount !== undefined ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                {doc.issueCount} temuan
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="hidden min-w-0 md:block">
        <p className="truncate text-[12px] font-medium text-ink-700">{doc.templateName || 'Konfigurasi manual'}</p>
        <p className="mt-0.5 text-[10px] text-ink-400">{doc.templateName ? 'Template pedoman' : 'Tanpa template'}</p>
      </div>

      <div className="hidden md:block">
        <StatusBadge status={doc.status} />
        {doc.issueCount !== null && doc.issueCount !== undefined ? (
          <p className="mt-1.5 text-[10px] font-medium text-amber-700">{doc.issueCount} temuan</p>
        ) : (
          <p className="mt-1.5 text-[10px] text-ink-400">Belum diperiksa</p>
        )}
      </div>

      <div className="flex items-center gap-0.5 md:justify-end">
        <Link
          to={`/app/documents/${doc.id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition hover:bg-white hover:text-brand-600"
          aria-label={`Buka ${doc.originalName}`}
          title="Buka workspace"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
        <IconButton
          label={processedName ? 'Unduh hasil formatting' : 'File hasil belum tersedia'}
          className="h-8 w-8"
          disabled={!processedName || downloading}
          onClick={() => onDownload(doc)}
        >
          <Download className={cx('h-4 w-4', downloading && 'animate-pulse')} />
        </IconButton>
        <IconButton
          label="Hapus dokumen"
          className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
          onClick={() => onDelete(doc)}
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  );
}

export default function History() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, status]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (status) params.set('status', status);
    api
      .get(`/documents?${params.toString()}`)
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch((err) => {
        if (active) error(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, debouncedQuery, status, reloadKey, error]);

  const documents = data?.documents || [];
  const totalPages = data?.totalPages || 1;
  const hasFilters = Boolean(debouncedQuery || status);

  const resetFilters = () => {
    setQuery('');
    setStatus('');
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/documents/${deleteTarget.id}`);
      success('Dokumen dihapus', { description: 'File asli dan hasil formatting ikut dihapus dari penyimpanan.' });
      setDeleteTarget(null);
      if (documents.length === 1 && page > 1) setPage((current) => current - 1);
      else setReloadKey((key) => key + 1);
    } catch (err) {
      error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (doc) => {
    setDownloadingId(doc.id);
    try {
      await downloadFile(`/documents/${doc.id}/download?variant=processed`, `${doc.originalName.replace(/\.docx$/i, '')}-rapimakalah.docx`);
      success('Unduhan dimulai');
    } catch (err) {
      error(err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const range = useMemo(() => {
    if (!data?.total) return null;
    const start = (data.page - 1) * data.limit + 1;
    const end = Math.min(data.page * data.limit, data.total);
    return `${start}–${end} dari ${data.total} dokumen`;
  }, [data]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Dokumen"
        title="Riwayat dokumen"
        description="Semua DOCX yang pernah Anda unggah. Buka workspace, unduh hasil formatting, atau hapus file beserta salinan hasilnya."
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} onClick={() => setReloadKey((key) => key + 1)} disabled={loading}>
              Muat ulang
            </Button>
            <Button icon={UploadCloud} onClick={() => navigate('/app/documents/new')}>
              Upload dokumen
            </Button>
          </>
        }
      />

      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama dokumen…"
              className="field-input h-9 pl-9 pr-8 text-[12px]"
              aria-label="Cari dokumen"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-400 hover:bg-slate-100 hover:text-ink-700"
                aria-label="Bersihkan pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-9 w-full text-[12px] sm:w-40"
              aria-label="Filter status"
            >
              {STATUS_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>{filter.label}</option>
              ))}
            </Select>
            {range && <span className="hidden shrink-0 text-[11px] text-ink-400 lg:block">{range}</span>}
          </div>
        </div>

        {loading ? (
          <SkeletonRows />
        ) : documents.length ? (
          <>
            <div className="hidden grid-cols-[minmax(0,1fr)_140px_112px_92px] gap-4 border-b border-line bg-slate-50/60 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-400 md:grid">
              <span>Dokumen</span>
              <span>Template</span>
              <span>Status</span>
              <span className="text-right">Aksi</span>
            </div>
            <div className="divide-y divide-line">
              {documents.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  onDelete={setDeleteTarget}
                  onDownload={handleDownload}
                  downloading={downloadingId === doc.id}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-line px-4 py-3 sm:px-5">
                <p className="text-[11px] text-ink-500">
                  Halaman {data?.page || 1} dari {totalPages}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={ChevronLeft}
                    disabled={(data?.page || 1) <= 1 || loading}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={(data?.page || 1) >= totalPages || loading}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  >
                    Berikutnya
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            className="m-5 border-0 bg-slate-50/40"
            icon={Files}
            title={hasFilters ? 'Tidak ada dokumen yang cocok' : 'Belum ada dokumen'}
            description={
              hasFilters
                ? 'Coba kata kunci lain atau hapus filter status untuk melihat semua dokumen.'
                : 'Unggah dokumen Word pertama Anda untuk memeriksa margin, font, spasi, heading, dan penomoran halaman.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={resetFilters}>Hapus filter</Button>
              ) : (
                <Button icon={UploadCloud} onClick={() => navigate('/app/documents/new')}>Upload dokumen</Button>
              )
            }
          />
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => (deleting ? null : setDeleteTarget(null))}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus dokumen ini?"
        description={
          deleteTarget
            ? `“${deleteTarget.originalName}” akan dihapus permanen beserta file hasil formatting. Tindakan ini tidak dapat dibatalkan.`
            : ''
        }
      />
    </AppShell>
  );
}
