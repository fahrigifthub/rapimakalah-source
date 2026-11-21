import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function bool(value, fallback = false) {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

export const config = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  canonicalUrl: process.env.CANONICAL_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'paperly-dev-secret-change-me',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  storageDir: path.resolve(root, process.env.STORAGE_DIR || './storage'),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_MB || 20) * 1024 * 1024,
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 20),
  cookieSecure: bool(process.env.COOKIE_SECURE, false),
  isProduction: process.env.NODE_ENV === 'production',
  root,
};
