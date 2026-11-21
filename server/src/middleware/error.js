export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Ukuran file melebihi batas yang diizinkan.' });
  }
  if (err?.status) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err?.name === 'ZodError') {
    return res.status(422).json({
      error: 'Data yang dikirim tidak valid.',
      details: err.issues?.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  console.error('[paperly] Unhandled error:', err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server. Silakan coba lagi.' });
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
