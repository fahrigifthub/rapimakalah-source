export function parseJson(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function toJson(value) {
  return JSON.stringify(value);
}

export function safeFileName(name) {
  const base = String(name || 'dokumen')
    .replace(/\.docx$/i, '')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  return base || 'dokumen';
}

export function pagination(query, defaults = { page: 1, limit: 20 }) {
  const page = Math.max(1, Number(query.page) || defaults.page);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || defaults.limit));
  return { page, limit, skip: (page - 1) * limit };
}
