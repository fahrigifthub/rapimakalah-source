import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  FileDown,
  Globe,
  Layers,
  LayoutTemplate,
  Link2,
  Pencil,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { AppShell } from '../components/AppShell.jsx';
import { PageHeader, PageLoader, EmptyState, Spinner } from '../components/ui/Common.jsx';
import { Button, IconButton } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ConfirmDialog, Modal } from '../components/ui/Modal.jsx';
import { TemplatePreview } from '../components/TemplatePreview.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { cx } from '../lib/format.js';
import { configSummary } from '../lib/templateConfig.js';

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'system', label: 'Bawaan' },
  { key: 'custom', label: 'Template saya' },
];

function TemplateCard({ template, onUse, onEdit, onDuplicate, onDelete, onShare, onPublish, duplicating, publishing }) {
  const summary = configSummary(template.config);
  return (
    <article className="surface-card flex flex-col overflow-hidden transition hover:shadow-pop">
      <div className="relative border-b border-line bg-gradient-to-b from-slate-50/80 to-white p-3">
        <div className="absolute left-3 top-3 z-10 flex gap-1.5">
          <Badge tone={template.isSystem ? 'blue' : 'green'}>{template.isSystem ? 'Bawaan' : 'Kustom'}</Badge>
          {template.isPublished && <Badge tone="amber">Publik</Badge>}
        </div>
        <TemplatePreview config={template.config} className="h-[176px] border-0 bg-transparent p-0" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[14px] font-semibold text-ink-900">{template.name}</h2>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.05em] text-ink-400">{template.category}</p>
          </div>
          {template.usageCount > 0 && (
            <span className="shrink-0 rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-ink-500">
              {template.usageCount}× dipakai
            </span>
          )}
        </div>

        <p className="mt-2 line-clamp-2 min-h-[2.4em] text-[12px] leading-relaxed text-ink-500">
          {template.description || 'Template kustom tanpa deskripsi.'}
        </p>

        <ul className="mt-3 flex flex-1 flex-wrap content-start gap-1.5">
          {summary.map((item) => (
            <li key={item} className="rounded-md border border-line bg-white px-1.5 py-1 text-[10px] text-ink-500">
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center gap-1.5 border-t border-line pt-3">
          <Button size="sm" icon={ArrowRight} className="flex-1 justify-center" onClick={() => onUse(template)}>
            Pakai
          </Button>
          {template.isSystem ? (
            <IconButton
              label="Duplikat template bawaan"
              disabled={duplicating}
              onClick={() => onDuplicate(template)}
              className="border-line"
            >
              <Copy className={cx('h-3.5 w-3.5', duplicating && 'animate-pulse')} />
            </IconButton>
          ) : (
            <>
              <IconButton
                label={template.shareId ? 'Tautan berbagi aktif' : 'Bagikan template'}
                onClick={() => onShare(template)}
                className={cx('border-line', template.shareId && 'text-brand-700')}
              >
                <Share2 className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton
                label={template.isPublished ? 'Tarik dari galeri publik' : 'Terbitkan ke galeri publik'}
                onClick={() => onPublish(template)}
                disabled={publishing}
                className={cx('border-line', template.isPublished && 'text-amber-600')}
              >
                <Globe className={cx('h-3.5 w-3.5', publishing && 'animate-pulse')} />
              </IconButton>
              <IconButton label="Edit template" onClick={() => onEdit(template)} className="border-line">
                <Pencil className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton
                label="Duplikat template"
                disabled={duplicating}
                onClick={() => onDuplicate(template)}
                className="border-line"
              >
                <Copy className={cx('h-3.5 w-3.5', duplicating && 'animate-pulse')} />
              </IconButton>
              <IconButton
                label="Hapus template"
                onClick={() => onDelete(template)}
                className="border-line hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Templates() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [publishingId, setPublishingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const [shareId, setShareId] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  const load = () => {
    setLoading(true);
    return api
      .get('/templates')
      .then((payload) => setTemplates(payload.templates || []))
      .catch((err) => error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return templates.filter((template) => {
      if (filter === 'system' && !template.isSystem) return false;
      if (filter === 'custom' && template.isSystem) return false;
      if (!needle) return true;
      return (
        template.name.toLowerCase().includes(needle) ||
        (template.description || '').toLowerCase().includes(needle) ||
        template.category.toLowerCase().includes(needle)
      );
    });
  }, [templates, filter, query]);

  const systemCount = templates.filter((template) => template.isSystem).length;
  const customCount = templates.length - systemCount;

  const handleUse = (template) => {
    navigate(`/app/documents/new?template=${template.id}`);
  };

  const handleDuplicate = async (template) => {
    setDuplicatingId(template.id);
    try {
      const response = await api.post(`/templates/${template.id}/duplicate`);
      success('Template diduplikasi', { description: `“${response.template.name}” siap diedit.` });
      navigate(`/app/templates/${response.template.id}`);
    } catch (err) {
      error(err.message);
    } finally {
      setDuplicatingId(null);
    }
  };

  const togglePublish = async (template) => {
    setPublishingId(template.id);
    try {
      if (template.isPublished) {
        await api.delete(`/templates/${template.id}/publish`);
        setTemplates((items) => items.map((item) => (item.id === template.id ? { ...item, isPublished: false, publishedAt: null } : item)));
        success('Ditarik dari galeri', { description: `“${template.name}” tidak lagi tampil di galeri publik.` });
      } else {
        const payload = await api.post(`/templates/${template.id}/publish`);
        setTemplates((items) => items.map((item) => (item.id === template.id ? { ...item, isPublished: payload.template.isPublished, publishedAt: payload.template.publishedAt } : item)));
        success('Diterbitkan ke galeri', { description: `“${template.name}” sekarang bisa ditemukan pengguna lain.` });
      }
    } catch (err) {
      error(err.message);
    } finally {
      setPublishingId(null);
    }
  };

  const openShare = async (template) => {
    setShareTarget(template);
    setCopied(false);
    setShareId(template.shareId || null);
    if (template.shareId) return;
    setShareLoading(true);
    try {
      const payload = await api.post(`/templates/${template.id}/share`);
      setShareId(payload.shareId);
      setTemplates((items) => items.map((item) => (item.id === template.id ? { ...item, shareId: payload.shareId } : item)));
    } catch (err) {
      error(err.message);
      setShareTarget(null);
    } finally {
      setShareLoading(false);
    }
  };

  const shareUrl = shareId ? `${window.location.origin}/t/${shareId}` : '';

  const copyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      success('Tautan disalin', { description: 'Kirim ke teman atau grup kelas Anda.' });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      error('Browser menolak menyalin otomatis. Salin manual dari kolom tautan.');
    }
  };

  const revokeShare = async () => {
    if (!shareTarget) return;
    setRevoking(true);
    try {
      await api.delete(`/templates/${shareTarget.id}/share`);
      setTemplates((items) => items.map((item) => (item.id === shareTarget.id ? { ...item, shareId: null } : item)));
      setShareId(null);
      setShareTarget(null);
      success('Tautan dicabut', { description: 'Tautan lama tidak bisa dipakai lagi.' });
    } catch (err) {
      error(err.message);
    } finally {
      setRevoking(false);
    }
  };

  const handleImport = async (event) => {
    event?.preventDefault();
    const raw = importCode.trim();
    // Terima kode pendek maupun tautan penuh, mis. https://.../t/abcd2345
    const code = raw.replace(/\s+/g, '').replace(/\/+$/, '').split('/').pop().toLowerCase();
    if (!code) {
      setImportError('Masukkan kode atau tautan template.');
      return;
    }
    setImportError('');
    setImporting(true);
    try {
      const payload = await api.post(`/share/${encodeURIComponent(code)}/import`);
      success('Template disimpan', { description: `“${payload.template.name}” siap dipakai.` });
      setImportOpen(false);
      setImportCode('');
      navigate(`/app/templates/${payload.template.id}`);
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/templates/${deleteTarget.id}`);
      success('Template dihapus');
      setDeleteTarget(null);
      setTemplates((items) => items.filter((item) => item.id !== deleteTarget.id));
    } catch (err) {
      error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Template"
        title="Template pedoman format"
        description="Template menyimpan margin, tipografi, heading, penomoran halaman, dan daftar isi. Template bawaan bisa diduplikasi, lalu disesuaikan dengan pedoman kampus Anda."
        actions={
          <>
            <Button variant="secondary" icon={Globe} onClick={() => navigate('/galeri')}>
              Galeri publik
            </Button>
            <Button variant="secondary" icon={FileDown} onClick={() => setImportOpen(true)}>
              Impor template
            </Button>
            <Button icon={Plus} onClick={() => navigate('/app/templates/new')}>
              Template kustom
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-line bg-white p-1">
          {FILTERS.map((item) => {
            const count = item.key === 'system' ? systemCount : item.key === 'custom' ? customCount : templates.length;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={cx(
                  'rounded-md px-2.5 py-1.5 text-[12px] font-medium transition',
                  filter === item.key ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-slate-50 hover:text-ink-900',
                )}
              >
                {item.label}
                <span className="ml-1.5 text-[10px] tabular-nums text-ink-400">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari template…"
            className="field-input h-9 pl-9 text-[12px]"
            aria-label="Cari template"
          />
        </div>
      </div>

      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-line bg-white px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <p className="text-[11px] leading-relaxed text-ink-500">
          Template bawaan disediakan sebagai titik awal berdasarkan pedoman kampus yang umum — bukan klaim bahwa
          setiap institusi memakai angka yang sama. Periksa pedoman resmi Anda dan sesuaikan pada template kustom.
          Tombol <Globe className="inline h-3 w-3 align-[-2px]" /> menerbitkan template kustom ke galeri publik;
          tarik kembali kapan saja.
        </p>
      </div>

      {loading ? (
        <div className="surface-card">
          <PageLoader label="Memuat template…" />
        </div>
      ) : filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={handleUse}
              onEdit={(item) => navigate(`/app/templates/${item.id}`)}
              onDuplicate={handleDuplicate}
              onDelete={setDeleteTarget}
              onShare={openShare}
              onPublish={togglePublish}
              duplicating={duplicatingId === template.id}
              publishing={publishingId === template.id}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={query ? Search : LayoutTemplate}
          title={query ? 'Template tidak ditemukan' : 'Belum ada template kustom'}
          description={
            query
              ? 'Coba kata kunci lain atau ganti filter jenis template.'
              : 'Buat template pertama Anda untuk menyimpan pedoman format kampus secara konsisten.'
          }
          action={<Button icon={Plus} onClick={() => navigate('/app/templates/new')}>Buat template</Button>}
        />
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="surface-card flex items-start gap-3 p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Layers className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[12px] font-semibold text-ink-800">Konfigurasi lengkap</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-ink-500">Margin, font, heading, penomoran, dan field daftar isi.</p>
          </div>
        </div>
        <div className="surface-card flex items-start gap-3 p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <BookOpen className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[12px] font-semibold text-ink-800">Berbasis pedoman</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-ink-500">Mulai dari template akademik umum, lalu sesuaikan angka resminya.</p>
          </div>
        </div>
        <div className="surface-card flex items-start gap-3 p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[12px] font-semibold text-ink-800">Konsisten</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-ink-500">Gunakan template yang sama setiap kali memproses dokumen baru.</p>
          </div>
        </div>
      </div>

      <Modal
        open={Boolean(shareTarget)}
        onClose={() => (shareLoading || revoking ? null : setShareTarget(null))}
        title="Bagikan template"
        description={
          shareTarget
            ? `Tautan ini membawa pengaturan “${shareTarget.name}” persis seperti yang Anda buat.`
            : ''
        }
      >
        {shareLoading ? (
          <div className="flex items-center gap-2 py-6 text-[12px] text-ink-500">
            <Spinner /> Membuat kode berbagi…
          </div>
        ) : shareUrl ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="share-url" className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400">
                Tautan berbagi
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="relative flex-1">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                  <input
                    id="share-url"
                    readOnly
                    value={shareUrl}
                    onFocus={(event) => event.target.select()}
                    className="field-input h-9 pl-9 text-[12px]"
                  />
                </div>
                <Button size="sm" icon={copied ? Check : Copy} onClick={copyShareLink}>
                  {copied ? 'Disalin' : 'Salin'}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-slate-50/70 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400">Kode template</p>
              <p className="mt-1 font-mono text-[18px] font-semibold tracking-[0.18em] text-ink-900">{shareId}</p>
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink-500">
                Penerima bisa memasukkan kode ini lewat tombol{' '}
                <strong className="font-medium text-ink-700">Impor template</strong> di halaman Template.
              </p>
            </div>

            <ul className="space-y-1.5 text-[11.5px] leading-relaxed text-ink-500">
              <li>• Penerima masuk atau daftar dulu, lalu menekan “Simpan ke akun saya”.</li>
              <li>• Salinan mereka independen: mengubah salinan tidak mengubah template Anda.</li>
              <li>• Halaman berbagi tidak diindeks mesin pencari.</li>
            </ul>

            <div className="border-t border-line pt-3">
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={revokeShare}
                loading={revoking}
                className="text-red-600 hover:bg-red-50"
              >
                Cabut tautan berbagi
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-[12px] text-ink-500">Tautan belum aktif.</p>
        )}
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => (importing ? null : setImportOpen(false))}
        title="Impor template"
        description="Tempel tautan berbagi atau kode 8 karakter yang Anda terima."
        footer={
          <>
            <Button variant="secondary" onClick={() => setImportOpen(false)} disabled={importing}>
              Batal
            </Button>
            <Button type="submit" form="import-template-form" loading={importing} icon={FileDown}>
              Simpan ke akun saya
            </Button>
          </>
        }
      >
        <form id="import-template-form" onSubmit={handleImport} className="space-y-3">
          <label htmlFor="import-code" className="block text-[12px] font-medium text-ink-700">
            Tautan atau kode template
          </label>
          <input
            id="import-code"
            value={importCode}
            onChange={(event) => setImportCode(event.target.value)}
            placeholder="https://domain-anda.example/t/abcd2345"
            autoComplete="off"
            spellCheck={false}
            autoFocus
            className="field-input h-9 text-[12px]"
          />
          {importError && (
            <p className="flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-[11.5px] leading-relaxed text-red-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {importError}
            </p>
          )}
          <p className="text-[10.5px] leading-relaxed text-ink-400">
            Margin, font, heading, penomoran halaman, dan daftar isi disalin apa adanya ke akun Anda.
          </p>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => (deleting ? null : setDeleteTarget(null))}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus template?"
        description={
          deleteTarget
            ? `Template “${deleteTarget.name}” akan dihapus. Dokumen yang pernah memakai template ini tidak ikut terhapus.`
            : ''
        }
      />
    </AppShell>
  );
}
