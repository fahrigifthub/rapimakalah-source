import { createApp } from './app.js';
import { config } from './config.js';
import { ensureStorage } from './lib/storage.js';
import { prisma } from './db.js';

async function main() {
  await ensureStorage();
  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`[paperly] API berjalan di http://localhost:${config.port}`);
  });
  const shutdown = async (signal) => {
    console.log(`\n[paperly] Menerima ${signal}, menutup server…`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error('[paperly] Gagal menjalankan server:', error);
  process.exit(1);
});
