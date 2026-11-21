import { prisma } from '../db.js';
import { DEFAULT_TEMPLATE_CONFIG, normalizeTemplateConfig } from '../templates/defaults.js';
import { HttpError } from '../middleware/error.js';

export async function findAccessibleTemplate(templateId, userId) {
  if (!templateId) return null;
  return prisma.formatTemplate.findFirst({
    where: { id: templateId, OR: [{ isSystem: true }, { ownerId: userId }] },
  });
}

export async function resolveFormatConfig({ templateId, config, userId }) {
  if (config) {
    return { config: normalizeTemplateConfig(config), template: templateId ? await findAccessibleTemplate(templateId, userId) : null };
  }
  if (templateId) {
    const template = await findAccessibleTemplate(templateId, userId);
    if (!template) throw new HttpError(404, 'Template tidak ditemukan atau bukan milik Anda.');
    return { config: normalizeTemplateConfig(JSON.parse(template.config)), template };
  }
  const fallback = await prisma.formatTemplate.findFirst({ where: { isSystem: true }, orderBy: { name: 'asc' } });
  return {
    config: fallback ? normalizeTemplateConfig(JSON.parse(fallback.config)) : structuredClone(DEFAULT_TEMPLATE_CONFIG),
    template: fallback,
  };
}
