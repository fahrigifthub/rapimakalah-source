import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { authenticate, clearAuthCookie } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { deleteStored } from '../lib/storage.js';
import { z } from 'zod';

const googleCredentialSchema = z.string().min(1).max(10000);
export const accountRouter = Router();
const googleClient = new OAuth2Client(config.googleClientId);
accountRouter.use(authenticate);

accountRouter.delete(
  '/',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new HttpError(404, 'Akun tidak ditemukan.');
    if (user.passwordHash) {
      const password = String(req.body?.password || '');
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) throw new HttpError(400, 'Password salah. Penghapusan akun dibatalkan.');
    } else {
      const parsedCredential = googleCredentialSchema.safeParse(req.body?.credential);
      if (!parsedCredential.success) {
        throw new HttpError(400, 'Silakan verifikasi akun Google untuk menghapus akun.');
      }
      if (!config.googleClientId) throw new HttpError(503, 'Verifikasi Google tidak tersedia.');
      try {
        const ticket = await googleClient.verifyIdToken({ idToken: parsedCredential.data, audience: config.googleClientId });
        const payload = ticket.getPayload();
        if (payload?.sub !== user.googleSub || payload?.email_verified !== true) {
          throw new HttpError(403, 'Akun Google tidak cocok dengan akun yang sedang masuk.');
        }
      } catch (err) {
        if (err?.status) throw err;
        throw new HttpError(401, 'Verifikasi akun Google gagal.');
      }
    }
    const documents = await prisma.document.findMany({ where: { userId: user.id }, select: { storedName: true, processedName: true } });
    for (const doc of documents) {
      await deleteStored(user.id, doc.storedName);
      if (doc.processedName) await deleteStored(user.id, doc.processedName);
    }
    await prisma.user.delete({ where: { id: user.id } });
    clearAuthCookie(res);
    res.json({ ok: true });
  }),
);
