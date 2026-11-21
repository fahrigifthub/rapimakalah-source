import { PrismaClient } from '@prisma/client';
import { SYSTEM_TEMPLATES } from '../src/templates/defaults.js';

const prisma = new PrismaClient();

async function main() {
  const existingCount = await prisma.user.count();
  if (existingCount === 0) {
    console.log('[seed] Membuat admin default...');
  }
  for (const template of SYSTEM_TEMPLATES) {
    const existing = await prisma.formatTemplate.findFirst({ where: { isSystem: true, name: template.name } });
    if (existing) {
      await prisma.formatTemplate.update({
        where: { id: existing.id },
        data: { description: template.description, category: template.category, config: JSON.stringify(template.config) },
      });
      console.log(`[seed] Template diperbarui: ${template.name}`);
    } else {
      await prisma.formatTemplate.create({
        data: {
          name: template.name,
          description: template.description,
          category: template.category,
          isSystem: true,
          config: JSON.stringify(template.config),
        },
      });
      console.log(`[seed] Template dibuat: ${template.name}`);
    }
  }
}

main()
  .catch((error) => {
    console.error('[seed] Gagal:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
