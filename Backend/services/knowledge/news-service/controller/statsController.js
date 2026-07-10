'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess } = require('../utils/response');

// Real counts from the database — no mock numbers. Used by the dashboard Overview
// widget instead of hardcoded stats.
async function getOverview(req, res, next) {
    try {
        const [totalArticles, articlesLast24h, totalSources, activeSources, lastArticle, categoryCounts] = await Promise.all([
            db.Article.count(),
            db.Article.count({ where: { ingested_at: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
            db.Source.count(),
            db.Source.count({ where: { is_active: true } }),
            db.Article.findOne({ order: [['ingested_at', 'DESC']], attributes: ['ingested_at'] }),
            db.Article.findAll({
                attributes: ['category', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
                group: ['category'],
                raw: true,
            }),
        ]);

        return sendSuccess(req, res, {
            totalArticles,
            articlesLast24h,
            totalSources,
            activeSources,
            lastIngestedAt: lastArticle ? lastArticle.ingested_at : null,
            byCategory: categoryCounts.map((row) => ({ category: row.category, count: Number(row.count) })),
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = { getOverview };
