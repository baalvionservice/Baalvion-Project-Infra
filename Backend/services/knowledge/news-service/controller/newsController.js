'use strict';
const { z } = require('zod');
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendPaginated, sendSuccess } = require('../utils/response');

const CATEGORIES = ['AI', 'Technology', 'Business', 'Finance', 'Startups', 'Cybersecurity', 'World', 'Science'];
const SENTIMENTS = ['positive', 'neutral', 'negative'];

const listQuerySchema = z.object({
    keyword: z.string().trim().min(1).max(200).optional(),
    country: z.string().trim().length(2).optional(),
    category: z.enum(CATEGORIES).optional(),
    language: z.string().trim().max(10).optional(),
    sentiment: z.enum(SENTIMENTS).optional(),
    source: z.string().trim().max(200).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

async function listArticles(req, res, next) {
    try {
        const parsed = listQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            throw new AppError('INVALID_QUERY', 'Invalid query parameters', 400, parsed.error.flatten());
        }
        const { keyword, country, category, language, sentiment, source, from, to, page, limit } = parsed.data;

        const where = {};
        if (country) where.country = country.toUpperCase();
        if (category) where.category = category;
        if (language) where.language = language;
        if (sentiment) where.sentiment = sentiment;
        if (keyword) where.title = { [Op.iLike]: `%${keyword}%` };
        if (from || to) {
            where.published_at = {};
            if (from) where.published_at[Op.gte] = from;
            if (to) where.published_at[Op.lte] = to;
        }

        const include = [{
            model: db.Source,
            as: 'source',
            attributes: ['id', 'name', 'type'],
            ...(source ? { where: { name: { [Op.iLike]: `%${source}%` } } } : {}),
        }];

        const { rows, count } = await db.Article.findAndCountAll({
            where,
            include,
            order: [['published_at', 'DESC']],
            limit,
            offset: (page - 1) * limit,
        });

        return sendPaginated(req, res, {
            items: rows,
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit),
        });
    } catch (err) {
        return next(err);
    }
}

const trendingQuerySchema = z.object({
    dimension: z.enum(['category', 'country', 'source']).default('category'),
    windowHours: z.coerce.number().int().min(1).max(168).default(24),
});

// Real volume-based trending: counts articles per dimension value in the current
// window vs. the equal-length prior window and ranks by % change. This is deliberately
// NOT entity/topic trending (e.g. "OpenAI +243%") — that requires the AI-enrichment
// phase (entity extraction) which hasn't landed yet. What's here is honest given the
// data actually in the table: category/country/source ingestion volume.
async function getTrending(req, res, next) {
    try {
        const parsed = trendingQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            throw new AppError('INVALID_QUERY', 'Invalid query parameters', 400, parsed.error.flatten());
        }
        const { dimension, windowHours } = parsed.data;
        const windowMs = windowHours * 60 * 60 * 1000;
        const now = new Date();
        const windowStart = new Date(now.getTime() - windowMs);
        const priorWindowStart = new Date(now.getTime() - 2 * windowMs);

        const groupColumn = dimension === 'source' ? 'source_id' : dimension;

        const [current, prior] = await Promise.all([
            db.Article.findAll({
                attributes: [groupColumn, [db.sequelize.fn('COUNT', db.sequelize.col('article.id')), 'count']],
                where: { published_at: { [Op.gte]: windowStart } },
                include: dimension === 'source' ? [{ model: db.Source, as: 'source', attributes: ['name'] }] : [],
                group: dimension === 'source' ? [groupColumn, 'source.id', 'source.name'] : [groupColumn],
                raw: true,
            }),
            db.Article.findAll({
                attributes: [groupColumn, [db.sequelize.fn('COUNT', db.sequelize.col('article.id')), 'count']],
                where: { published_at: { [Op.gte]: priorWindowStart, [Op.lt]: windowStart } },
                include: dimension === 'source' ? [{ model: db.Source, as: 'source', attributes: ['name'] }] : [],
                group: dimension === 'source' ? [groupColumn, 'source.id', 'source.name'] : [groupColumn],
                raw: true,
            }),
        ]);

        const priorByKey = new Map(prior.map((row) => [row[groupColumn], Number(row.count)]));
        const items = current
            .map((row) => {
                const key = row[groupColumn];
                const currentCount = Number(row.count);
                const priorCount = priorByKey.get(key) || 0;
                const changePct = priorCount === 0 ? null : Math.round(((currentCount - priorCount) / priorCount) * 100);
                return {
                    value: dimension === 'source' ? row['source.name'] : key,
                    count: currentCount,
                    priorCount,
                    changePct,
                };
            })
            .sort((a, b) => b.count - a.count);

        return sendSuccess(req, res, { dimension, windowHours, items });
    } catch (err) {
        return next(err);
    }
}

async function getArticle(req, res, next) {
    try {
        const article = await db.Article.findByPk(req.params.id, {
            include: [{ model: db.Source, as: 'source', attributes: ['id', 'name', 'type'] }],
        });
        if (!article) throw new AppError('NOT_FOUND', 'Article not found', 404);
        return sendSuccess(req, res, article);
    } catch (err) {
        return next(err);
    }
}

module.exports = { listArticles, getTrending, getArticle };
