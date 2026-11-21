import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db.js';
import { issueToken, setAuthCookie, clearAuthCookie, authenticate } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from '../validation/schemas.js';

export const authRouter = Router();

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
    res.status(201).json({ user });
  }),
);

authRouter.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new HttpError(401, 'Email atau password salah.');
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
    res.json({ user });
  }),
);

authRouter.post(
  '/password',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!valid) throw new HttpError(400, 'Password saat ini salah.');
    const passwordHash = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    res.json({ ok: true });
  }),
);
