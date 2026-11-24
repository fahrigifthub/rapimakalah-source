import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db.js';
import { issueToken, setAuthCookie, clearAuthCookie, authenticate } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from '../validation/schemas.js';
import { config } from '../config.js';

export const authRouter = Router();
const googleClient = new OAuth2Client(config.googleClientId);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' },
});

authRouter.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new HttpError(409, 'Email sudah terdaftar. Silakan masuk.');
    const isFirstUser = (await prisma.user.count()) === 0;
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash, role: isFirstUser ? 'admin' : 'user' },
      select: { id: true, name: true, email: true, institution: true, programStudy: true, createdAt: true, role: true },
    });
    await prisma.activity.create({ data: { userId: user.id, type: 'auth', message: 'Akun RapiMakalah dibuat' } });
    setAuthCookie(res, issueToken(user));
    res.status(201).json({ user: { ...user, hasPassword: true, authProvider: 'password' } });
  }),
);

authRouter.get('/config', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ googleClientId: config.googleClientId || null });
});

authRouter.post(
  '/google',
  authLimiter,
  asyncHandler(async (req, res) => {
    if (!config.googleClientId) throw new HttpError(503, 'Login Google belum dikonfigurasi.');
    const credential = typeof req.body?.credential === 'string' ? req.body.credential : '';
    if (!credential || credential.length > 10000) throw new HttpError(400, 'Token Google tidak valid.');

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: config.googleClientId });
      payload = ticket.getPayload();
    } catch {
      throw new HttpError(401, 'Verifikasi akun Google gagal. Silakan coba lagi.');
    }
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new HttpError(401, 'Google tidak mengembalikan email terverifikasi.');
    }

    const email = payload.email.trim().toLowerCase();
    let user = await prisma.user.findUnique({ where: { googleSub: payload.sub } });
    if (!user) {
      // Jangan menghubungkan provider ke akun lokal hanya berdasarkan email.
      // Pemilik akun lokal harus masuk dengan password terlebih dahulu.
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new HttpError(409, 'Email ini sudah terdaftar. Masuk menggunakan email dan password akun tersebut.');
      }

      const isFirstUser = (await prisma.user.count()) === 0;
      try {
        user = await prisma.user.create({
          data: {
            email,
            name: String(payload.name || email.split('@')[0]).trim().slice(0, 80) || 'Pengguna Google',
            googleSub: payload.sub,
            role: isFirstUser ? 'admin' : 'user',
          },
          select: { id: true, name: true, email: true, institution: true, programStudy: true, createdAt: true, role: true },
        });
        await prisma.activity.create({ data: { userId: user.id, type: 'auth', message: 'Akun RapiMakalah dibuat melalui Google' } });
      } catch (err) {
        if (err?.code !== 'P2002') throw err;
        user = await prisma.user.findUnique({ where: { googleSub: payload.sub } });
        if (!user) {
          const emailOwner = await prisma.user.findUnique({ where: { email } });
          if (emailOwner) {
            throw new HttpError(409, 'Email ini sudah terdaftar. Masuk menggunakan email dan password akun tersebut.');
          }
          throw err;
        }
      }
    }

    setAuthCookie(res, issueToken(user));
    res.json({ user: {
      id: user.id,
      name: user.name,
      email: user.email,
      institution: user.institution,
      programStudy: user.programStudy,
      createdAt: user.createdAt,
      role: user.role,
      hasPassword: Boolean(user.passwordHash),
      authProvider: user.passwordHash ? 'google+password' : 'google',
    } });
  }),
);

authRouter.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user?.passwordHash) throw new HttpError(401, 'Email atau password salah. Jika akun dibuat dengan Google, gunakan tombol Masuk dengan Google.');
    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw new HttpError(401, 'Email atau password salah.');
    setAuthCookie(res, issueToken(user));
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        institution: user.institution,
        programStudy: user.programStudy,
        createdAt: user.createdAt,
        role: user.role,
        hasPassword: Boolean(user.passwordHash),
        authProvider: user.passwordHash ? 'password' : 'google',
      },
    });
  }),
);

authRouter.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.get('/me', authenticate, (req, res) => {
  res.json({ user: { ...req.user, role: req.user.role } });
});

authRouter.patch(
  '/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: data.name,
        institution: data.institution || null,
        programStudy: data.programStudy || null,
      },
      select: { id: true, name: true, email: true, institution: true, programStudy: true, createdAt: true, role: true },
    });
    res.json({
      user: {
        ...user,
        role: req.user.role,
        hasPassword: req.user.hasPassword,
        authProvider: req.user.authProvider,
      },
    });
  }),
);

authRouter.post(
  '/password',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new HttpError(404, 'Akun tidak ditemukan.');
    if (user.passwordHash) {
      const valid = await bcrypt.compare(data.currentPassword || '', user.passwordHash);
      if (!valid) throw new HttpError(400, 'Password saat ini salah.');
    }
    const passwordHash = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    res.json({ ok: true, hasPassword: true, authProvider: user.googleSub ? 'google+password' : 'password' });
  }),
);
