const BASE = '/api';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let unauthorizedHandler = null;

export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
}

async function request(path, { method = 'GET', body, headers, signal, cache } = {}) {
  const options = {
    method,
    credentials: 'include',
    headers: { ...(headers || {}) },
    signal,
  };
  if (cache) options.cache = cache;
  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(`${BASE}${path}`, options);
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server RapiMakalah. Pastikan backend berjalan.', 0);
  }
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : null;
  if (!response.ok) {
    if (response.status === 401) unauthorizedHandler?.();
    throw new ApiError(payload?.error || 'Permintaan gagal diproses.', response.status, payload?.details);
  }
  return payload;
}

export const api = {
  get: (path, options) => request(path, options),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, body, options) => request(path, { ...options, method: 'DELETE', body }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData }),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get(`/admin/users?${new URLSearchParams(params)}`),
  resetPassword: (userId) => api.post(`/admin/users/${userId}/reset-password`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getDocuments: (params) => api.get(`/admin/documents?${new URLSearchParams(params)}`),
  getDocumentPreview: (documentId, variant = 'processed') =>
    api.get(`/admin/documents/${documentId}/preview?variant=${variant}`),
  downloadDocument: (documentId, variant = 'processed') =>
    downloadFile(`/admin/documents/${documentId}/download?variant=${variant}`, 'dokumen.docx'),
};

export async function downloadFile(path, fallbackName = 'dokumen.docx', options = {}) {
  const requestOptions = { credentials: 'include', ...options };
  if (requestOptions.body && !(requestOptions.body instanceof FormData)) {
    requestOptions.headers = { ...(requestOptions.headers || {}), 'Content-Type': 'application/json' };
    requestOptions.body = JSON.stringify(requestOptions.body);
  }
  const response = await fetch(`${BASE}${path}`, requestOptions);
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    if (response.status === 401) unauthorizedHandler?.();
    throw new ApiError(payload?.error || 'Unduhan gagal.', response.status);
  }
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  const name = match ? decodeURIComponent(match[1]) : fallbackName;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function uploadFile(path, formData) {
  return request(path, { method: 'POST', body: formData });
}
