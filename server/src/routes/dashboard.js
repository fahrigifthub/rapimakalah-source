import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { parseJson } from '../lib/utils.js';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const [totalDocuments, readyDocuments, processedAggregate, documents, activities, templateUsage] = await Promise.all([
      prisma.document.count({ where: { userId } }),
      prisma.document.count({ where: { userId, status: 'ready' } }),
      prisma.document.aggregate({ where: { userId }, _sum: { size: true, processedSize: true } }),
      prisma.document.findMany({
        where: { userId },
        include: { template: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.activity.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 8 }),
      prisma.document.groupBy({
        by: ['templateId'],
        where: { userId, templateId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { templateId: 'desc' } },
        take: 5,
      }),
    ]);

    const templateIds = templateUsage.map((t) => t.templateId).filter(Boolean);
    const templates = templateIds.length
      ? await prisma.formatTemplate.findMany({ where: { id: { in: templateIds } }, select: { id: true, name: true, category: true } })
      : [];
    const templateMap = new Map(templates.map((t) => [t.id, t]));

    let totalWords = 0;
    let totalPages = 0;
    let issueTotal = 0;
    let docsWithAnalysis = 0;
    for (const doc of documents) {
      const stats = parseJson(doc.stats, null);
      if (stats?.words) totalWords += stats.words;
      if (doc.pageCount) totalPages += doc.pageCount;
      const issues = parseJson(doc.issues, null);
      if (issues?.issueCount !== undefined) {
        issueTotal += issues.issueCount;
        docsWithAnalysis += 1;
      }
    }

    res.json({
      stats: {
        totalDocuments,
        readyDocuments,
        totalWords,
        totalPages,
        averageIssues: docsWithAnalysis ? Math.round(issueTotal / docsWithAnalysis) : 0,
        storageBytes: processedAggregate._sum.size || 0,
      },
      recentDocuments: documents.map((d) => ({
        id: d.id,
        originalName: d.originalName,
        size: d.size,
        status: d.status,
        pageCount: d.pageCount,
        templateName: d.template?.name || null,
        processedAt: d.processedAt,
        createdAt: d.createdAt,
        stats: parseJson(d.stats, null),
        issueCount: parseJson(d.issues, null)?.issueCount ?? null,
      })),
      activities,
      templateUsage: templateUsage
        .filter((t) => templateMap.has(t.templateId))
        .map((t) => ({ ...templateMap.get(t.templateId), count: t._count._all })),
    });
  }),
);

dashboardRouter.get(
  '/activities',
  asyncHandler(async (req, res) => {
    const activities = await prisma.activity.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: Math.min(100, Number(req.query.limit) || 30),
    });
    res.json({ activities });
  }),
);
