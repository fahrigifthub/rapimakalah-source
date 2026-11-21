import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '../../lib/format.js';

export function Field({ label, hint, error, children, htmlFor, className }) {
  return (
    <div className={className}>
      {label && (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs leading-relaxed text-red-600">{error}</p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cx('field-input', className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className, rows = 3, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cx('field-input resize-y', className)} {...props} />;
});

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cx('field-input appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
    </div>
  );
});

export function Toggle({ checked, onChange, label, description, disabled = false, id }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <label
      htmlFor={inputId}
      className={cx(
        'flex cursor-pointer items-start justify-between gap-4 py-2.5',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink-900">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={inputId}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.checked)}
        />
        <span className="h-5 w-9 rounded-full bg-slate-200 transition peer-checked:bg-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

export function Checkbox({ checked, onChange, label, description, disabled = false }) {
  return (
    <label className={cx('flex cursor-pointer items-start gap-2.5 py-1.5', disabled && 'cursor-not-allowed opacity-60')}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 accent-brand-600 focus:ring-brand-200"
      />
      <span className="min-w-0">
        <span className="block text-[13px] font-medium leading-snug text-ink-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">{description}</span>}
      </span>
    </label>
  );
}
