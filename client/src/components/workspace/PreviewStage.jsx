import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Columns2, Loader2, Minus, Plus, RotateCcw } from 'lucide-react';
import { DocumentPreview } from '../DocumentPreview.jsx';
import { IconButton } from '../ui/Button.jsx';
import { cx } from '../../lib/format.js';

function EmptyPreview({ label }) {
  return (
    <div className="flex h-full min-h-[260px] items-center justify-center">
      <div className="max-w-xs rounded-xl border border-dashed border-slate-300 bg-white/70 px-6 py-8 text-center">
        <p className="text-[12px] font-medium text-ink-600">{label}</p>
        <p className="mt-1 text-[10px] leading-relaxed text-ink-400">
          Pratinjau akan muncul setelah dokumen dianalisis atau diproses.
        </p>
      </div>
    </div>
  );
}

export function PreviewStage({
  originalPreview,
  processedPreview,
  view,
  compare,
  pageIndex,
  onPageChange,
  zoom,
  onZoomChange,
  config,
  highlightOriginal,
  highlightProcessed,
  loading,
}) {
  const scrollRef = useRef(null);
  const activePreview = view === 'processed' ? processedPreview : originalPreview;
  const pages = activePreview?.pages || [];
  const totalPages = compare ? Math.max(originalPreview?.pages?.length || 0, processedPreview?.pages?.length || 0) : pages.length;
  const currentPage = Math.min(pageIndex, Math.max(0, totalPages - 1));

  const rowRefs = useRef([]);

  const activeFromScroll = () => {
    const box = scrollRef.current;
    if (!box || !totalPages) return 0;
    if (box.scrollTop + box.clientHeight >= box.scrollHeight - 4) return totalPages - 1;
    const limit = box.getBoundingClientRect().top + box.clientHeight * 0.35;
    let active = 0;
    for (let i = 0; i < totalPages; i += 1) {
      const el = rowRefs.current[i];
      if (el && el.getBoundingClientRect().top <= limit) active = i;
    }
    return active;
  };

  const handleScroll = () => {
    const active = activeFromScroll();
    if (active !== currentPage) onPageChange(active);
  };

  // Page buttons / external page changes scroll the page into view; scrolling
  // by hand already matches currentPage, so nothing happens in that case.
  useEffect(() => {
    if (activeFromScroll() === currentPage) return;
    rowRefs.current[currentPage]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentPage]);

  useEffect(() => {
    rowRefs.current[currentPage]?.scrollIntoView({ block: 'start' });
  }, [view, compare]);
  const changeZoom = (delta) => onZoomChange(Math.min(1.6, Math.max(0.6, Math.round((zoom + delta) * 100) / 100)));

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#EDEFF2]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white/70 px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-ink-500">
            {totalPages ? `Halaman ${currentPage + 1} dari ${totalPages}` : 'Tanpa halaman'}
          </span>
          <span className="rounded bg-white px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wider text-ink-400 ring-1 ring-slate-200">
            estimasi
          </span>
        </div>
        <div className="flex items-center gap-1">
          <IconButton label="Halaman sebelumnya" onClick={() => onPageChange(Math.max(0, currentPage - 1))} disabled={currentPage <= 0}>
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <div className="flex h-7 min-w-[52px] items-center justify-center rounded-md border border-line bg-white px-2 text-[10px] font-medium tabular-nums text-ink-700">
            {currentPage + 1} / {Math.max(1, totalPages)}
          </div>
          <IconButton label="Halaman berikutnya" onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage >= totalPages - 1}>
            <ChevronRight className="h-4 w-4" />
          </IconButton>
          <span className="mx-1.5 h-4 w-px bg-slate-200" />
          <IconButton label="Perkecil" onClick={() => changeZoom(-0.1)} disabled={zoom <= 0.6}>
            <Minus className="h-3.5 w-3.5" />
          </IconButton>
          <button
            type="button"
            onClick={() => onZoomChange(1)}
            className="flex h-7 min-w-[46px] items-center justify-center rounded-md px-1 text-[10px] font-medium tabular-nums text-ink-600 hover:bg-white"
            title="Kembalikan zoom ke 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          <IconButton label="Perbesar" onClick={() => changeZoom(0.1)} disabled={zoom >= 1.6}>
            <Plus className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton label="Reset zoom" onClick={() => onZoomChange(1)}>
            <RotateCcw className="h-3 w-3" />
          </IconButton>
        </div>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-auto px-3 py-5 sm:px-6">
        {loading && !originalPreview && !processedPreview ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-[12px] text-ink-500">
            <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            Menyiapkan pratinjau...
          </div>
        ) : compare ? (
          <div className="mx-auto flex w-fit flex-col gap-6">
            {Array.from({ length: totalPages }, (_, i) => (
              <div key={i} ref={(el) => { rowRefs.current[i] = el; }} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div>
                  <p className="mb-2 flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Sebelum - hal. {i + 1}
                  </p>
                  {originalPreview?.pages?.[i] ? (
                    <DocumentPreview preview={originalPreview} pageIndex={i} zoom={zoom} config={config} highlightForBlock={highlightOriginal} />
                  ) : (
                    <EmptyPreview label={originalPreview ? 'Tidak ada halaman ini' : 'Pratinjau asli belum tersedia'} />
                  )}
                </div>
                <div>
                  <p className="mb-2 flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Sesudah - hal. {i + 1}
                  </p>
                  {processedPreview?.pages?.[i] ? (
                    <DocumentPreview preview={processedPreview} pageIndex={i} zoom={zoom} config={config} highlightForBlock={highlightProcessed} />
                  ) : (
                    <EmptyPreview label={processedPreview ? 'Tidak ada halaman ini' : 'Jalankan formatting untuk membandingkan'} />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : activePreview ? (
          <div className="mx-auto flex w-fit flex-col gap-6">
            {pages.map((_, i) => (
              <div key={i} ref={(el) => { rowRefs.current[i] = el; }}>
                <DocumentPreview
                  preview={activePreview}
                  pageIndex={i}
                  zoom={zoom}
                  config={config}
                  highlightForBlock={view === 'processed' ? highlightProcessed : highlightOriginal}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyPreview label="Pratinjau belum tersedia" />
        )}
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200/80 bg-white/70 px-4 py-1.5 text-[9px] text-ink-400">
        <span className="flex items-center gap-1">
          <Columns2 className="h-2.5 w-2.5" /> Pratinjau struktural dari OOXML — bukan rendering identik Microsoft Word.
        </span>
        {activePreview && <span>{activePreview.meta?.charsPerLine} karakter/baris · {activePreview.meta?.linesPerPage} baris/halaman</span>}
      </div>
    </div>
  );
}
