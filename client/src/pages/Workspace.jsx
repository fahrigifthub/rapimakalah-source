import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  Columns2,
  Download,
  FileText,
  Loader2,
  MoreHorizontal,
  RotateCcw,
  ScanSearch,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
  UploadCloud,
  Wand2,
  X,
} from 'lucide-react';
import { AppShell } from '../components/AppShell.jsx';
import { UploadZone } from '../components/UploadZone.jsx';
import { PageHeader, PageLoader, EmptyState, IconTile } from '../components/ui/Common.jsx';
import { Button, IconButton } from '../components/ui/Button.jsx';
import { StatusBadge, Badge } from '../components/ui/Badge.jsx';
import { Field, Input } from '../components/ui/Form.jsx';
import { Modal, ConfirmDialog } from '../components/ui/Modal.jsx';
import { PageSidebar } from '../components/workspace/PageSidebar.jsx';
import { PreviewStage } from '../components/workspace/PreviewStage.jsx';
import { FormatPanel, DEFAULT_OPTIONS, DEFAULT_META } from '../components/workspace/FormatPanel.jsx';
import { CheckerPanel } from '../components/workspace/CheckerPanel.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, downloadFile } from '../lib/api.js';
import { cx, formatBytes, formatDate } from '../lib/format.js';

const SEVERITY_RANK = { warning: 1, error: 2 };

function issueMapFor(analysis) {
  const map = {};
  if (!analysis?.checks) return map;
  for (const check of analysis.checks) {
    for (const issue of check.issues || []) {
      if (issue.blockIndex === undefined || issue.blockIndex === null) continue;
      const current = map[issue.blockIndex];
      if (!current || SEVERITY_RANK[issue.severity] > SEVERITY_RANK[current]) {
        map[issue.blockIndex] = issue.severity;
      }
    }
  }
  return map;
}

function NewDocumentWorkspace() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');

  return (
    <AppShell>
      <PageHeader
        eyebrow="Workspace"
        title="Dokumen baru"
        description="Unggah dokumen Word (.docx) atau tempel teks makalah langsung. Setelah dokumen siap, RapiMakalah akan membuka workspace untuk memilih template, memeriksa format, dan menerapkan perbaikan."
        actions={
          <Link to="/app/documents" className="text-[12px] font-medium text-brand-600 hover:text-brand-700">
            Lihat riwayat dokumen
          </Link>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="surface-card p-5">
          <UploadZone
            onUploaded={(doc) => {
              success('Dokumen berhasil diunggah');
              navigate(`/app/documents/${doc.id}${templateId ? `?template=${templateId}` : ''}`);
            }}
            onError={(message) => error(message)}
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { title: '1. Validasi', text: 'Signature ZIP dan struktur OOXML diperiksa.' },
              { title: '2. Analisis', text: 'Temuan format dijelaskan per paragraf.' },
              { title: '3. Formatting', text: 'File DOCX asli diubah, konten dipertahankan.' },
            ].map((step) => (
              <div key={step.title} className="rounded-lg border border-line bg-slate-50/60 p-3">
                <p className="text-[11px] font-semibold text-ink-700">{step.title}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-ink-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="surface-card p-5">
            <IconTile icon={ShieldCheck} tone="green" />
            <h3 className="mt-3 text-[13px] font-semibold">Dokumen tetap milik Anda</h3>
            <ul className="mt-2 space-y-2 text-[11px] leading-relaxed text-ink-500">
              <li>• File disimpan dengan nama UUID internal dan tidak dapat diakses publik.</li>
              <li>• Endpoint selalu memeriksa pemilik dokumen sebelum membaca file.</li>
              <li>• File asli dipertahankan agar hasil formatting bisa dibatalkan.</li>
              <li>• Isi dokumen tidak digunakan untuk pelatihan model AI.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
              <TriangleAlert className="h-3.5 w-3.5" /> Batasan format
            </p>
            <p className="mt-1.5 text-[10px] leading-relaxed text-amber-800/85">
              Dokumen harus berformat .docx. File .doc lama, PDF, atau DOCX yang rusak tidak dapat diproses. Pagination
              dan daftar isi final tetap memerlukan pembaruan di Microsoft Word.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function Workspace() {
  const { id } = useParams();
  if (!id) return <NewDocumentWorkspace />;
  return <WorkspaceView key={id} id={id} />;
}

function WorkspaceView({ id }) {
  const navigate = useNavigate();
  const { success, error, info } = useToast();
  const [doc, setDoc] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [config, setConfig] = useState(null);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [meta, setMeta] = useState(DEFAULT_META);
  const [analyses, setAnalyses] = useState({ original: null, processed: null });
  const [analysisVariant, setAnalysisVariant] = useState('original');
  const [previews, setPreviews] = useState({ original: null, processed: null });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [view, setView] = useState('original');
  const [compare, setCompare] = useState(false);
  const [zoom, setZoom] = useState(0.95);
  const [pageIndex, setPageIndex] = useState(0);
  const [tab, setTab] = useState('format');
  const [panelOpen, setPanelOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [downloadVariant, setDownloadVariant] = useState('processed');
  const [downloadBaseName, setDownloadBaseName] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [focusBlock, setFocusBlock] = useState(null);
  const moreRef = useRef(null);

  useEffect(() => {
    const onClick = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || null,
    [templates, selectedTemplateId],
  );

  const activePreview = view === 'processed' ? previews.processed : previews.original;
  const activeAnalysis = useMemo(() => {
    if (view === 'processed' && analyses.processed) return analyses.processed;
    return analyses.original || analyses.processed;
  }, [view, analyses]);
  const activeAnalysisVariant = activeAnalysis === analyses.processed && analyses.processed ? 'processed' : 'original';

  const issueMapOriginal = useMemo(() => issueMapFor(analyses.original), [analyses.original]);
  const issueMapProcessed = useMemo(() => issueMapFor(analyses.processed), [analyses.processed]);

  const highlightOriginal = useCallback((blockIndex) => issueMapOriginal[blockIndex] || null, [issueMapOriginal]);
  const highlightProcessed = useCallback((blockIndex) => issueMapProcessed[blockIndex] || null, [issueMapProcessed]);

  const refreshPreviews = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const [original, processed] = await Promise.all([
        api.get(`/documents/${id}/preview?variant=original`, { cache: 'no-store' }).catch(() => null),
        doc?.processedAt
          ? api.get(`/documents/${id}/preview?variant=processed`, { cache: 'no-store' }).catch(() => null)
          : Promise.resolve(null),
      ]);
      setPreviews({
        original: original?.preview || null,
        processed: processed?.preview || null,
      });
    } finally {
      setPreviewLoading(false);
    }
  }, [id, doc?.processedAt]);

  const runAnalysis = useCallback(
    async (nextConfig, nextTemplateId, { quiet = false } = {}) => {
      setAnalyzing(true);
      try {
        const response = await api.post(`/documents/${id}/analyze`, {
          templateId: nextTemplateId || null,
          config: nextConfig,
          options,
          variant: 'original',
        });
        setAnalyses((current) => ({ ...current, original: response.analysis }));
        setAnalysisVariant('original');
        setDoc((current) =>
          current
            ? {
                ...current,
                config: response.config,
                issues: response.analysis,
                headings: response.analysis.headings,
                stats: response.analysis.stats,
                templateId: response.template?.id || current.templateId,
              }
            : current,
        );
        if (!quiet) info('Pemeriksaan selesai', { description: `${response.analysis.issueCount} temuan format ditemukan.` });
        return response;
      } catch (err) {
        if (!quiet) error(err.message);
        return null;
      } finally {
        setAnalyzing(false);
      }
    },
    [id, options, info, error],
  );

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const [docResponse, templateResponse] = await Promise.all([
          api.get(`/documents/${id}`),
          api.get('/templates'),
        ]);
        if (!active) return;
        const document = docResponse.document;
        const templateList = templateResponse.templates;
        const initialTemplateId = document.templateId || templateList.find((template) => template.isSystem)?.id || '';
        const initialConfig =
          document.config ||
          templateList.find((template) => template.id === initialTemplateId)?.config ||
          templateList[0]?.config ||
          null;
        setDoc(document);
        setTemplates(templateList);
        setSelectedTemplateId(initialTemplateId);
        setConfig(initialConfig);
        setOptions({ ...DEFAULT_OPTIONS, ...(document.options || {}) });
        setMeta((current) => ({ ...current, title: document.originalName.replace(/\.docx$/i, '').replace(/[-_]+/g, ' ') }));
        setDownloadBaseName(document.originalName.replace(/\.docx$/i, ''));

        const processedAnalysis = document.status === 'ready' && document.issues ? document.issues : null;
        if (processedAnalysis) {
          setAnalyses({ original: null, processed: processedAnalysis });
          setAnalysisVariant('processed');
          setView('processed');
        }
        setLoading(false);

        const [originalPreview, processedPreview] = await Promise.all([
          api.get(`/documents/${id}/preview?variant=original`, { cache: 'no-store' }).catch(() => null),
          document.processedAt ? api.get(`/documents/${id}/preview?variant=processed`, { cache: 'no-store' }).catch(() => null) : Promise.resolve(null),
        ]);
        if (!active) return;
        setPreviews({ original: originalPreview?.preview || null, processed: processedPreview?.preview || null });

        if (!processedAnalysis) {
          setAnalyzing(true);
          try {
            const analysisResponse = await api.post(`/documents/${id}/analyze`, {
              templateId: initialTemplateId || null,
              config: initialConfig,
              options: document.options || DEFAULT_OPTIONS,
              variant: 'original',
            });
            if (!active) return;
            setAnalyses({ original: analysisResponse.analysis, processed: null });
            setAnalysisVariant('original');
            setDoc((current) =>
              current
                ? {
                    ...current,
                    config: analysisResponse.config,
                    issues: analysisResponse.analysis,
                    headings: analysisResponse.analysis.headings,
                    stats: analysisResponse.analysis.stats,
                  }
                : current,
            );
          } catch (err) {
            if (active) error(err.message);
          } finally {
            if (active) setAnalyzing(false);
          }
        }
      } catch (err) {
        if (active) setLoadError(err.message);
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!focusBlock) return undefined;
    const timer = setTimeout(() => {
      const element = document.querySelector(`[data-block="${focusBlock}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setFocusBlock(null);
    }, 120);
    return () => clearTimeout(timer);
  }, [focusBlock, pageIndex, view]);

  const liveSeq = useRef(0);
  const liveFirst = useRef(true);
  useEffect(() => {
    if (!doc || !config) return undefined;
    if (liveFirst.current) {
      liveFirst.current = false;
      return undefined;
    }
    const seq = ++liveSeq.current;
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const response = await api.post(`/documents/${id}/live-preview`, {
          templateId: selectedTemplateId || null,
          config,
          options,
          meta,
        });
        if (seq !== liveSeq.current) return;
        setPreviews((current) => ({ ...current, processed: response.preview }));
        setView('processed');
      } catch {
        /* preview langsung bersifat opsional */
      } finally {
        if (seq === liveSeq.current) setPreviewLoading(false);
      }
    }, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, options, meta, doc?.id]);

  const handlePageChange = (index) => setPageIndex(Math.max(0, index));

  const handleTemplateChange = async (templateId) => {
    const template = templates.find((item) => item.id === templateId);
    const nextConfig = template?.config || config;
    setSelectedTemplateId(templateId);
    setConfig(nextConfig);
    setTab('format');
    const response = await runAnalysis(nextConfig, templateId);
    if (response) {
       const original = await api.get(`/documents/${id}/preview?variant=original`, { cache: 'no-store' }).catch(() => null);
       const processed = doc?.processedAt
         ? await api.get(`/documents/${id}/preview?variant=processed`, { cache: 'no-store' }).catch(() => null)
        : null;
      setPreviews({ original: original?.preview || null, processed: processed?.preview || null });
      setPageIndex(0);
      setView('original');
      setCompare(false);
    }
  };

  const handleReanalyze = async () => {
    const response = await runAnalysis(config, selectedTemplateId);
    if (response) {
      setView('original');
      setPageIndex(0);
      setCompare(false);
      setTab('check');
      refreshPreviews();
    }
  };

  const handleFormat = async () => {
    setFormatting(true);
    setReport(null);
    try {
      const response = await api.post(`/documents/${id}/format`, {
        templateId: selectedTemplateId || null,
        config,
        options,
        meta,
      });
      setDoc(response.document);
      setReport(response.report);
      if (response.analysis) {
        setAnalyses((current) => ({ ...current, processed: response.analysis }));
        setAnalysisVariant('processed');
      }
      setView('processed');
      setCompare(false);
      setPageIndex(0);
      setTab('check');
      setPreviewLoading(true);
       const processed = await api.get(`/documents/${id}/preview?variant=processed`, { cache: 'no-store' }).catch(() => null);
      setPreviews((current) => ({ ...current, processed: processed?.preview || null }));
      setPreviewLoading(false);
      success('Dokumen berhasil dirapikan', {
        description: `${response.report?.stats?.pageCount || '—'} halaman estimasi · ${response.analysis?.issueCount ?? 0} temuan tersisa.`,
      });
    } catch (err) {
      error(err.message, { description: 'File asli tetap aman dan tidak diubah.' });
    } finally {
      setFormatting(false);
    }
  };

  const handleReset = async () => {
    setActionBusy(true);
    try {
      const response = await api.post(`/documents/${id}/reset`);
      setDoc(response.document);
      setPreviews((current) => ({ ...current, processed: null }));
      setAnalyses((current) => ({ ...current, processed: null }));
      setAnalysisVariant('original');
      setView('original');
      setReport(null);
      setResetOpen(false);
      success('Hasil formatting dibatalkan. File asli tetap tersedia.');
    } catch (err) {
      error(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleDelete = async () => {
    setActionBusy(true);
    try {
      await api.delete(`/documents/${id}`);
      success('Dokumen dihapus dari riwayat.');
      navigate('/app/documents');
    } catch (err) {
      error(err.message);
      setActionBusy(false);
    }
  };

  const handleDownload = async () => {
    setActionBusy(true);
    try {
      const variant = downloadVariant === 'original' ? 'original' : 'processed';
      const name = downloadBaseName.trim() || 'dokumen';
      await downloadFile(`/documents/${id}/download?variant=${variant}&name=${encodeURIComponent(name)}`, `${name}.docx`);
      setDownloadOpen(false);
      success('Unduhan dimulai.');
    } catch (err) {
      error(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const locateIssue = (issue) => {
    if (issue.blockIndex === undefined || issue.blockIndex === null) return;
    const targetVariant = activeAnalysisVariant;
    const preview = targetVariant === 'processed' ? previews.processed : previews.original;
    if (!preview) return;
    const index = preview.pages.findIndex((page) => page.blocks.some((block) => block.blockIndex === issue.blockIndex));
    if (index >= 0) {
      setView(targetVariant);
      setCompare(false);
      setPageIndex(index);
      setFocusBlock(issue.blockIndex);
      if (window.innerWidth < 1024) setPanelOpen(false);
    }
  };

  if (loading) {
    return (
      <AppShell flush>
        <div className="flex h-[calc(100vh-56px)] items-center justify-center">
          <PageLoader label="Membuka workspace dokumen…" />
        </div>
      </AppShell>
    );
  }

  if (loadError || !doc) {
    return (
      <AppShell>
        <EmptyState
          icon={FileText}
          title="Dokumen tidak dapat dibuka"
          description={loadError || 'Dokumen tidak ditemukan atau bukan milik akun ini.'}
          action={<Button onClick={() => navigate('/app/documents')}>Kembali ke daftar dokumen</Button>}
        />
      </AppShell>
    );
  }

  const panelTabs = (
    <div className="flex shrink-0 items-center gap-0 border-b border-line px-2">
      <button
        type="button"
        onClick={() => setTab('format')}
        className={cx(
          'flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[11px] font-medium transition',
          tab === 'format' ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-400 hover:text-ink-700',
        )}
      >
        <SlidersHorizontal className="h-3 w-3" /> Formatting
      </button>
      <button
        type="button"
        onClick={() => setTab('check')}
        className={cx(
          'flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[11px] font-medium transition',
          tab === 'check' ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-400 hover:text-ink-700',
        )}
      >
        <ScanSearch className="h-3 w-3" /> Pemeriksaan
        {activeAnalysis?.issueCount > 0 && (
          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">{activeAnalysis.issueCount}</span>
        )}
      </button>
      <div className="ml-auto flex items-center gap-1">
        {doc.processedAt && (
          <IconButton label="Unduh hasil" onClick={() => { setDownloadVariant('processed'); setDownloadOpen(true); }} className="h-7 w-7">
            <Download className="h-3.5 w-3.5" />
          </IconButton>
        )}
        <IconButton label="Tutup panel" className="h-7 w-7" onClick={() => setPanelOpen(false)}>
          <X className="h-3.5 w-3.5" />
        </IconButton>
      </div>
    </div>
  );

  const panelContent = (
    tab === 'format' ? (
      <FormatPanel
        config={config}
        onConfigChange={setConfig}
        options={options}
        onOptionsChange={setOptions}
        meta={meta}
        onMetaChange={setMeta}
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={handleTemplateChange}
        onFormat={handleFormat}
        formatting={formatting}
        onReanalyze={handleReanalyze}
        analyzing={analyzing}
        warnings={report?.warnings || []}
        document={doc}
        report={report}
        onDownloadClick={() => { setDownloadVariant('processed'); setDownloadOpen(true); }}
      />
    ) : (
      <CheckerPanel
        analysis={activeAnalysis}
        variantLabel={activeAnalysisVariant === 'processed' ? 'Setelah formatting' : 'Dokumen asli'}
        onLocate={locateIssue}
        analyzing={analyzing}
        onReanalyze={handleReanalyze}
        hasProcessed={Boolean(doc.processedAt)}
      />
    )
  );

  return (
    <AppShell flush>
      <div className="flex h-[calc(100vh-56px)] min-h-0 flex-col">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-white px-3 py-2 sm:px-4">
          <Link to="/app/documents" className="rounded-lg p-1.5 text-ink-400 transition hover:bg-slate-100 hover:text-ink-700" aria-label="Kembali">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-slate-50 text-ink-400">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[13px] font-semibold text-ink-900">{doc.originalName}</h1>
              <StatusBadge status={doc.status} />
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-ink-400">
              <span>{formatBytes(doc.size)}</span>
              <span>·</span>
              <span>{selectedTemplate?.name || doc.templateName || 'Konfigurasi manual'}</span>
              <span>·</span>
              <span>{doc.pageCount ? `± ${doc.pageCount} halaman` : 'Belum diproses'}</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">diunggah {formatDate(doc.createdAt)}</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {doc.processedAt && (
              <button
                type="button"
                onClick={() => {
                  setCompare((value) => !value);
                  if (!compare) setPanelOpen(false);
                }}
                className={cx(
                  'hidden h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition sm:inline-flex',
                  compare ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-line bg-white text-ink-600 hover:bg-slate-50',
                )}
              >
                <Columns2 className="h-3.5 w-3.5" /> {compare ? 'Tutup banding' : 'Bandingkan'}
              </button>
            )}
            <div className="hidden items-center rounded-lg border border-line bg-slate-50 p-0.5 sm:flex">
              <button
                type="button"
                onClick={() => { setView('original'); setCompare(false); }}
                className={cx('rounded-md px-2 py-1 text-[10px] font-medium transition', view === 'original' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500')}
              >
                Asli
              </button>
              <button
                type="button"
                disabled={!previews.processed}
                onClick={() => { setView('processed'); setCompare(false); }}
                className={cx(
                  'rounded-md px-2 py-1 text-[10px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40',
                  view === 'processed' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500',
                )}
              >
                Hasil
              </button>
            </div>
            <Button
              size="sm"
              variant="secondary"
              icon={Download}
              className="hidden sm:inline-flex"
              disabled={!doc.processedAt}
              onClick={() => { setDownloadVariant(doc.processedAt ? 'processed' : 'original'); setDownloadOpen(true); }}
            >
              Unduh
            </Button>
            <div className="relative" ref={moreRef}>
              <IconButton label="Aksi lainnya" onClick={() => setMoreOpen((value) => !value)}>
                <MoreHorizontal className="h-4 w-4" />
              </IconButton>
              {moreOpen && (
                <div className="absolute right-0 top-9 z-40 w-56 animate-fade-up rounded-xl border border-line bg-white p-1.5 shadow-pop">
                  <button type="button" onClick={() => { setMoreOpen(false); setDownloadVariant('original'); setDownloadOpen(true); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-ink-700 hover:bg-slate-50">
                    <Download className="h-3.5 w-3.5 text-ink-400" /> Unduh file asli
                  </button>
                  <button
                    type="button"
                    disabled={!doc.processedAt}
                    onClick={() => { setMoreOpen(false); setResetOpen(true); }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-ink-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-ink-400" /> Batalkan hasil format
                  </button>
                  <div className="my-1 border-t border-line" />
                  <button type="button" onClick={() => { setMoreOpen(false); setDeleteOpen(true); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" /> Hapus dokumen
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 text-[11px] font-medium text-white lg:hidden"
            >
              <Wand2 className="h-3.5 w-3.5" /> Format
            </button>
          </div>
        </div>

        {doc.status === 'failed' && doc.errorMessage && (
          <div className="flex items-start gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-[11px] text-red-700">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Pemrosesan terakhir gagal: {doc.errorMessage} File asli tidak diubah.</span>
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-[214px] shrink-0 border-r border-line bg-white xl:flex xl:flex-col">
            <PageSidebar
              preview={activePreview}
              config={config}
              pageIndex={pageIndex}
              onPageChange={(index) => { setPageIndex(index); setCompare(false); }}
              headings={activePreview?.headings || []}
              activeVariantLabel={view === 'processed' ? 'Pratinjau hasil format' : 'Pratinjau dokumen asli'}
              onHeadingClick={(index) => { setPageIndex(index); setCompare(false); }}
            />
          </aside>

          <div className="min-w-0 flex-1">
            <PreviewStage
              originalPreview={previews.original}
              processedPreview={previews.processed}
              view={view}
              compare={compare}
              pageIndex={pageIndex}
              onPageChange={handlePageChange}
              zoom={zoom}
              onZoomChange={setZoom}
              config={config}
              highlightOriginal={highlightOriginal}
              highlightProcessed={highlightProcessed}
              loading={previewLoading}
            />
          </div>

          <aside className="hidden w-[340px] shrink-0 flex-col border-l border-line bg-white lg:flex">
            {panelTabs}
            <div className="min-h-0 flex-1">{panelContent}</div>
          </aside>
        </div>

        {panelOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button type="button" aria-label="Tutup panel" className="absolute inset-0 bg-slate-900/30" onClick={() => setPanelOpen(false)} />
            <div className="absolute inset-y-0 right-0 flex w-[92%] max-w-[390px] animate-fade-up flex-col bg-white shadow-pop">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="text-[13px] font-semibold">Workspace panel</span>
                <IconButton label="Tutup" onClick={() => setPanelOpen(false)}>
                  <X className="h-4 w-4" />
                </IconButton>
              </div>
              {panelTabs}
              <div className="min-h-0 flex-1">{panelContent}</div>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        title="Unduh dokumen"
        description="File DOCX hasil tetap dapat diedit di Microsoft Word."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDownloadOpen(false)} disabled={actionBusy}>Batal</Button>
            <Button icon={Download} loading={actionBusy} onClick={handleDownload}>Unduh DOCX</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nama file" hint="Ekstensi .docx ditambahkan otomatis.">
            <div className="flex items-center gap-2">
              <Input value={downloadBaseName} onChange={(event) => setDownloadBaseName(event.target.value)} placeholder="nama-dokumen" />
              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-2 text-[11px] text-ink-500">.docx</span>
            </div>
          </Field>
          <div className="space-y-2">
            <span className="field-label mb-0">Versi yang diunduh</span>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line p-3 hover:bg-slate-50">
              <input type="radio" name="variant" value="processed" checked={downloadVariant === 'processed'} onChange={() => setDownloadVariant('processed')} disabled={!doc.processedAt} className="mt-0.5 accent-brand-600" />
              <span>
                <span className="block text-[12px] font-medium text-ink-800">Hasil formatting</span>
                <span className="mt-0.5 block text-[10px] text-ink-500">
                  {doc.processedAt ? `Dibuat ${formatDate(doc.processedAt, { withTime: true })} · ${formatBytes(doc.processedSize)}` : 'Belum tersedia — jalankan formatting dulu.'}
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line p-3 hover:bg-slate-50">
              <input type="radio" name="variant" value="original" checked={downloadVariant === 'original'} onChange={() => setDownloadVariant('original')} className="mt-0.5 accent-brand-600" />
              <span>
                <span className="block text-[12px] font-medium text-ink-800">File asli</span>
                <span className="mt-0.5 block text-[10px] text-ink-500">Dokumen yang Anda unggah, tanpa perubahan.</span>
              </span>
            </label>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-[10px] leading-relaxed text-ink-500">
            Gambar, tabel, hyperlink, dan struktur tetap dipertahankan. Buka di Microsoft Word untuk memperbarui field TOC
            dan memeriksa pagination final.
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleReset}
        loading={actionBusy}
        title="Batalkan hasil formatting?"
        description="File hasil akan dihapus dan status kembali ke belum diproses. File asli tetap tersimpan dan tidak terpengaruh."
        confirmLabel="Batalkan hasil"
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={actionBusy}
        title="Hapus dokumen ini?"
        description="Dokumen asli dan file hasil akan dihapus permanen dari penyimpanan RapiMakalah. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus permanen"
      />
    </AppShell>
  );
}
