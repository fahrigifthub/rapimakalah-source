import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { documentsRouter } from './routes/documents.js';
import { templatesRouter } from './routes/templates.js';
import { dashboardRouter } from './routes/dashboard.js';
import { accountRouter } from './routes/account.js';
import { adminRouter } from './routes/admin.js';
import { shareRouter } from './routes/share.js';
import { galleryRouter } from './routes/gallery.js';
import { writingRouter } from './routes/writing.js';
import { errorHandler, notFound } from './middleware/error.js';
import { injectSeo, robotsHeaderFor } from './seo.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: { policy: 'same-site' },
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 600,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: 'Terlalu banyak permintaan. Coba beberapa saat lagi.' },
    }),
  );

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'paperly', time: new Date().toISOString() });
  });

  const clientPublic = path.resolve(config.root, '..', 'client', 'public');
  app.get('/robots.txt', (req, res) => {
    const content = fs.readFileSync(path.join(clientPublic, 'robots.txt'), 'utf8');
    res.type('text/plain').send(content.replaceAll('https://YOUR_DOMAIN', config.canonicalUrl.replace(/\/$/, '')));
  });
  app.get('/sitemap.xml', (req, res) => {
    const content = fs.readFileSync(path.join(clientPublic, 'sitemap.xml'), 'utf8');
    res.type('application/xml').send(content.replaceAll('https://YOUR_DOMAIN', config.canonicalUrl.replace(/\/$/, '')));
  });

  app.use('/api/auth', authRouter);
  app.use('/api/account', accountRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api/templates', templatesRouter);
  app.use('/api/share', shareRouter);
  app.use('/api/gallery', galleryRouter);
  app.use('/api/writing', writingRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/admin', adminRouter);

  app.use('/api', notFound);

  // Serve the built client in production (single-origin deployment).
  const clientDist = path.resolve(config.root, '..', 'client', 'dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
    const indexPath = path.join(clientDist, 'index.html');
    const htmlCache = new Map();
    let cachedIndex = null;
    const pageHtml = (pathname) => {
      const indexHtml = fs.readFileSync(indexPath, 'utf8');
      if (indexHtml !== cachedIndex) {
        htmlCache.clear();
        cachedIndex = indexHtml;
      }
      if (htmlCache.has(pathname)) return htmlCache.get(pathname);
      const html = injectSeo(indexHtml, pathname);
      if (htmlCache.size > 200) htmlCache.clear();
      htmlCache.set(pathname, html);
      return html;
    };
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      const robots = robotsHeaderFor(req.path);
      if (robots) res.set('X-Robots-Tag', robots);
      res.set('Cache-Control', robots ? 'no-store' : 'no-cache');
      res.type('html').send(pageHtml(req.path));
    });
  }

  app.use(errorHandler);
  return app;
}
