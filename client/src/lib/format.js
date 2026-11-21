export function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(value, { withTime = false } = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  if (withTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return new Intl.DateTimeFormat('id-ID', options).format(date);
}

export function relativeTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return formatDate(value);
}

export const STATUS_META = {
  uploaded: { label: 'Belum diproses', tone: 'slate' },
  processing: { label: 'Diproses', tone: 'blue' },
  ready: { label: 'Siap', tone: 'green' },
  failed: { label: 'Gagal', tone: 'red' },
};

export function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.uploaded;
}

export const SEVERITY_META = {
  ok: { label: 'Sesuai', tone: 'green' },
  warning: { label: 'Perlu diperiksa', tone: 'amber' },
  error: { label: 'Tidak sesuai', tone: 'red' },
};

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export const PAGE_SIZES = {
  A4: { label: 'A4 (21 × 29,7 cm)', width: 21, height: 29.7 },
  F4: { label: 'F4 / Folio (21,6 × 33 cm)', width: 21.59, height: 33 },
  Letter: { label: 'Letter (21,6 × 27,9 cm)', width: 21.59, height: 27.94 },
  A5: { label: 'A5 (14,8 × 21 cm)', width: 14.8, height: 21 },
};

export const FONT_OPTIONS = [
  'Times New Roman',
  'Arial',
  'Calibri',
  'Cambria',
  'Georgia',
  'Book Antiqua',
  'Segoe UI',
  'Verdana',
];

export function classForTone(tone) {
  switch (tone) {
    case 'green':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'amber':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'red':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'blue':
      return 'bg-brand-50 text-brand-700 border-brand-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}
