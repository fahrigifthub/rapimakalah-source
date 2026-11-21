import { cx, classForTone } from '../../lib/format.js';

export function Badge({ children, tone = 'slate', className, dot = false }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4',
        classForTone(tone),
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    uploaded: { label: 'Belum diproses', tone: 'slate' },
    processing: { label: 'Memproses', tone: 'blue' },
    ready: { label: 'Siap diunduh', tone: 'green' },
    failed: { label: 'Gagal', tone: 'red' },
  };
  const meta = map[status] || map.uploaded;
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
