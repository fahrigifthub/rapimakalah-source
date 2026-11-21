import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cx } from '../../lib/format.js';

const VARIANTS = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 border-transparent shadow-sm disabled:bg-brand-300',
  secondary:
    'bg-white text-ink-900 border-line hover:bg-slate-50 hover:border-slate-300 disabled:text-ink-400',
  ghost: 'bg-transparent text-ink-700 border-transparent hover:bg-slate-100 hover:text-ink-900',
  danger: 'bg-red-600 text-white border-transparent hover:bg-red-700 disabled:bg-red-300',
  dark: 'bg-ink-900 text-white border-transparent hover:bg-slate-800',
};

const SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-3.5 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
  icon: 'h-8 w-8 rounded-lg',
};

export const Button = forwardRef(function Button(
  { children, variant = 'primary', size = 'md', loading = false, className, disabled, type = 'button', icon: Icon, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cx(
        'inline-flex select-none items-center justify-center border font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
});

export function IconButton({ label, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-ink-500 transition hover:bg-slate-100 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
