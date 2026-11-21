import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FileSearch,
  Info,
  Loader2,
  MapPin,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { EmptyState } from '../ui/Common.jsx';
import { cx } from '../../lib/format.js';

const STATUS = {
  ok: { label: 'Sesuai', tone: 'green', icon: CheckCircle2 },
  warning: { label: 'Perlu diperiksa', tone: 'amber', icon: AlertTriangle },
  error: { label: 'Tidak sesuai', tone: 'red', icon: XCircle },
};

function ScoreRing({ score }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const color = score >= 90 ? '#059669' : score >= 65 ? '#D97706' : '#DC2626';
  return (
    <div className="relative h-[68px] w-[68px] shrink-0">
      <svg viewBox="0 0 68 68" className="h-full w-full -rotate-90">
        <circle cx="34" cy="34" r={radius} fill="none" stroke="#EEF1F5" strokeWidth="6" />
        <circle
          cx="34"
          cy="34"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[17px] font-semibold leading-none tabular-nums text-ink-900">{score}</span>
        <span className="text-[8px] uppercase tracking-wider text-ink-400">skor</span>
      </span>
    </div>
  );
}

function CheckCard({ check, onLocate }) {
  const meta = STATUS[check.status] || STATUS.warning;
  const Icon = meta.icon;
  const [open, setOpen] = useState(check.status !== 'ok');
  const issues = check.issues || [];
  return (
    <div className={cx('rounded-lg border', check.status === 'ok' ? 'border-line' : check.status === 'error' ? 'border-red-200' : 'border-amber-200')}>
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-start gap-2.5 p-3 text-left">
        <Icon className={cx('mt-0.5 h-3.5 w-3.5 shrink-0', check.status === 'ok' ? 'text-emerald-600' : check.status === 'error' ? 'text-red-600' : 'text-amber-600')} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-[12px] font-semibold text-ink-800">{check.label}</span>
            {issues.length > 0 && (
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-ink-500">{issues.length}</span>
            )}
          </span>
          <span className="mt-0.5 block text-[10px] leading-relaxed text-ink-500">{check.summary}</span>
        </span>
        <ChevronDown className={cx('mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && issues.length > 0 && (
        <div className="space-y-2 border-t border-line bg-slate-50/50 p-2.5">
          {issues.map((issue, index) => (
            <div key={`${issue.code}-${index}`} className="rounded-md border border-line bg-white p-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold leading-snug text-ink-800">{issue.title}</p>
                {issue.blockIndex !== undefined && onLocate && (
                  <button
                    type="button"
                    onClick={() => onLocate(issue)}
                    className="flex shrink-0 items-center gap-1 rounded border border-line px-1.5 py-0.5 text-[9px] font-medium text-ink-500 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <MapPin className="h-2.5 w-2.5" /> Lokasi
                  </button>
                )}
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-ink-500">{issue.message}</p>
              {issue.snippet && (
                <p className="mt-1.5 line-clamp-2 border-l-2 border-slate-200 pl-2 text-[9px] italic leading-relaxed text-ink-400">
                  “{issue.snippet}”
                </p>
              )}
              <div className="mt-1.5 flex items-start gap-1 rounded bg-brand-50/60 px-2 py-1.5">
                <ArrowRight className="mt-0.5 h-2.5 w-2.5 shrink-0 text-brand-500" />
                <p className="text-[9px] leading-relaxed text-brand-800">{issue.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CheckerPanel({ analysis, variantLabel, onLocate, analyzing, onReanalyze, hasProcessed }) {
  const summary = useMemo(() => {
    if (!analysis) return null;
    return analysis.totals || { ok: 0, warning: 0, error: 0 };
  }, [analysis]);

  if (!analysis && !analyzing) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <EmptyState
          icon={FileSearch}
          title="Belum ada hasil pemeriksaan"
          description="Jalankan pemeriksaan untuk melihat konsistensi font, spasi, margin, heading, dan lainnya."
          action={<Button size="sm" onClick={onReanalyze}>Periksa dokumen</Button>}
          className="border-0"
        />
      </div>
    );
  }

  if (analyzing && !analysis) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
        <p className="text-[12px] font-medium text-ink-700">Memeriksa struktur dokumen…</p>
        <p className="max-w-[220px] text-[10px] leading-relaxed text-ink-400">Membandingkan run teks, paragraf, section, dan heading dengan template.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-line px-4 py-3.5">
        <div className="flex items-center gap-3">
          <ScoreRing score={analysis.score} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={analysis.score >= 90 ? 'green' : analysis.score >= 65 ? 'amber' : 'red'}>
                {analysis.score >= 90 ? 'Dokumen konsisten' : analysis.score >= 65 ? 'Perlu perhatian' : 'Banyak ketidaksesuaian'}
              </Badge>
              {variantLabel && <span className="text-[9px] text-ink-400">{variantLabel}</span>}
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-ink-500">
              {analysis.issueCount} temuan pada {analysis.checks?.length || 0} kategori pemeriksaan.
            </p>
            <div className="mt-1.5 flex gap-2 text-[9px] text-ink-500">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {summary.ok} sesuai</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {summary.warning} periksa</span>
              {summary.error > 0 && <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> {summary.error} tidak sesuai</span>}
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="secondary" icon={RefreshCw} onClick={onReanalyze} loading={analyzing} className="h-7 flex-1 justify-center text-[11px]">
            Periksa ulang
          </Button>
          {hasProcessed && (
            <span className="flex flex-1 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-[10px] font-medium text-emerald-700">
              Hasil DOCX tersedia
            </span>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3.5 py-3">
        {analysis.checks?.map((check) => (
          <CheckCard key={check.key} check={check} onLocate={onLocate} />
        ))}
        <div className="flex items-start gap-2 rounded-lg border border-line bg-slate-50/70 p-3">
          <Info className="mt-0.5 h-3 w-3 shrink-0 text-ink-400" />
          <p className="text-[9px] leading-relaxed text-ink-500">
            Pemeriksaan membaca properti OOXML secara langsung. Nilai efektif yang diwarisi dari style kompleks dapat
            berbeda dari tampilan Word; selalu verifikasi hasil akhir.
          </p>
        </div>
      </div>
    </div>
  );
}
