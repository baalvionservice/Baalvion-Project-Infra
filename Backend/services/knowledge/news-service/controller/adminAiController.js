'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const enrichmentService = require('../service/enrichmentService');
const { sendSuccess } = require('../utils/response');

// Real sentiment distribution + top entities across the most recently enriched articles.
// Entities are aggregated in JS from each article's real per-article entity list (JSONB) —
// no separate entity table to query yet, and the volume here (a few hundred rows) doesn't
// warrant a Postgres-side JSONB aggregation query.
async function getOverview(req, res, next) {
    try {
        const [sentimentCounts, enrichedTotal, unenrichedTotal, recent] = await Promise.all([
            db.Article.findAll({
                where: { sentiment: { [Op.not]: null } },
                attributes: ['sentiment', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
                group: ['sentiment'],
                raw: true,
            }),
            db.Article.count({ where: { sentiment: { [Op.not]: null } } }),
            db.Article.count({ where: { sentiment: { [Op.is]: null } } }),
            db.Article.findAll({
                where: { entities: { [Op.not]: null } },
                order: [['ingested_at', 'DESC']],
                limit: 300,
                attributes: ['entities'],
                raw: true,
            }),
        ]);

        const entityCounts = new Map();
        for (const row of recent) {
            for (const e of row.entities || []) {
                entityCounts.set(e.name, (entityCounts.get(e.name) || 0) + (e.count || 1));
            }
        }
        const topEntities = Array.from(entityCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([name, count]) => ({ name, count }));

        return sendSuccess(req, res, {
            enrichedArticles: enrichedTotal,
            pendingEnrichment: unenrichedTotal,
            sentimentDistribution: sentimentCounts.map((r) => ({ sentiment: r.sentiment, count: Number(r.count) })),
            topEntities,
            method: 'lexicon-scorer', // honest label: not an external LLM call
        });
    } catch (err) {
        return next(err);
    }
}

// Triggers a batch enrichment pass over currently-unprocessed articles (real work, not a
// simulated progress bar) — returns how many rows were actually updated.
async function runEnrichment(req, res, next) {
    try {
        const limit = Math.min(1000, Math.max(1, parseInt(req.body?.limit, 10) || 200));
        const result = await enrichmentService.enrichUnprocessed(limit);
        return sendSuccess(req, res, result);
    } catch (err) {
        return next(err);
    }
}

module.exports = { getOverview, runEnrichment };
