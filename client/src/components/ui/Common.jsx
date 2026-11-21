import { Link } from 'react-router-dom';
import { FileText, Loader2, Plus } from 'lucide-react';
import { cx } from '../../lib/format.js';

export function Logo({ compact = false, className }) {
  return (
    <Link to="/" className={cx('inline-flex items-center gap-2.5', className)}>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M6 3.75h7.5L18 8.25V20.25H6V3.75Z" fill="white" fillOpacity="0.95" />
          <path d="M13.5 3.75v4.5H18" fill="#BFD7FE" />
          <path d="M9 12h6M9 15h4" stroke="#2563EB" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </span>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900">
          RapiMakalah
        </span>
      )}
    </Link>
  );
}

export function Spinner({ className }) {
  return <Loader2 className={cx('h-4 w-4 animate-spin text-ink-400', className)} />;
}

export function PageLoader({ label = 'Memuat…' }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-sm text-ink-500">
      <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
      {label}
    </div>
  );
}

export function EmptyState({ icon: Icon = FileText, title, description, action, className }) {
  return (
    <div className={cx('flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center', className)}>
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-ink-400">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">{eyebrow}</p>}
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-ink-900">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-500">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ title, description, actions }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function ProgressBar({ value = 0, className, tone = 'brand' }) {
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div
        className={cx('h-full rounded-full transition-all duration-500', tone === 'brand' ? 'bg-brand-600' : 'bg-emerald-500')}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function IconTile({ icon: Icon, tone = 'blue', className }) {
  const tones = {
    blue: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    slate: 'bg-slate-100 text-ink-700',
  };
  return (
    <span className={cx('flex h-8 w-8 items-center justify-center rounded-lg', tones[tone], className)}>
      <Icon className="h-4 w-4" />
    </span>
  );
}

export function PlusAction({ children, onClick, icon: Icon = Plus }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[13px] font-medium text-ink-500 transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700"
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}
