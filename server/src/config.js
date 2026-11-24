import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function bool(value, fallback = false) {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || 'paperly-dev-secret-change-me';

// Di produksi jangan pernah memakai secret default/placeholder: siapa pun yang
// tahu nilainya bisa memalsukan cookie sesi dan masuk sebagai user lain.
const INSECURE_SECRETS = new Set(['paperly-dev-secret-change-me', 'GANTI_DENGAN_STRING_ACAK_PANJANG']);
if (isProduction && (!process.env.JWT_SECRET || INSECURE_SECRETS.has(process.env.JWT_SECRET) || jwtSecret.length < 32)) {
  throw new Error('[config] JWT_SECRET wajib diisi nilai acak minimal 32 karakter saat NODE_ENV=production.');
}

export const config = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  canonicalUrl: process.env.CANONICAL_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret,
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  storageDir: path.resolve(root, process.env.STORAGE_DIR || './storage'),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_MB || 20) * 1024 * 1024,
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 20),
  cookieSecure: bool(process.env.COOKIE_SECURE, isProduction),
  isProduction,
  root,
};
