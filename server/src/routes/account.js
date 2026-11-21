import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate, clearAuthCookie } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { deleteStored } from '../lib/storage.js';

export const accountRouter = Router();
accountRouter.use(authenticate);

accountRouter.delete(
  '/',
  asyncHandler(async (req, res) => {
    const password = String(req.body?.password || '');
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new HttpError(400, 'Password salah. Penghapusan akun dibatalkan.');
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
