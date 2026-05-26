'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');
const { AppError } = require('../utils/errors');

const buildSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-') + '-' + Date.now();
};

const buildPagination = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
});

// GET /articles — public, filter by category/status/tags
const listArticles = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const where = {};

        if (req.query.category) where.category = req.query.category;
        if (req.query.status) {
            where.status = req.query.status;
        } else {
            // Public: only published by default unless authenticated and requesting own
            where.status = 'published';
        }
        if (req.query.tags) {
            const tags = Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags];
            where.tags = { [Op.contains]: tags };
        }
        if (req.query.author_id) where.author_id = parseInt(req.query.author_id);

        const { count, rows } = await db.Article.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']],
        });

        return sendPaginated(req, res, {
            items: rows,
            pagination: buildPagination(count, page, limit),
        });
    } catch (err) { return next(err); }
};

// POST /articles — auth required
const createArticle = async (req, res, next) => {
    try {
        const { title, content, summary, category, tags, cover_image, reading_time_min, org_id } = req.body;
        if (!title) return next(new AppError('VALIDATION_ERROR', 'Title is required', 400));

        const slug = buildSlug(title);

        const article = await db.Article.create({
            title,
            slug,
            content,
            summary,
            category,
            tags: tags || [],
            cover_image,
            reading_time_min: reading_time_min || 0,
            author_id: req.user.id,
            author_name: req.body.author_name || null,
            org_id: org_id || req.user.orgId || null,
            status: 'draft',
        });

        return sendSuccess(req, res, article, 201);
    } catch (err) { return next(err); }
};

// GET /articles/:id — public, by slug or id
const getArticle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const isNumeric = /^\d+$/.test(id);
        const where = isNumeric ? { id: parseInt(id) } : { slug: id };

        const article = await db.Article.findOne({
            where,
            include: [
                {
                    model: db.CreatorProfile,
                    as: 'creatorProfile',
                    required: false,
                },
            ],
        });

        if (!article) return next(new AppError('NOT_FOUND', 'Article not found', 404));

        // Increment views
        await article.increment('views_count');

        return sendSuccess(req, res, article);
    } catch (err) { return next(err); }
};

// PATCH /articles/:id — auth, only author or admin
const updateArticle = async (req, res, next) => {
    try {
        const article = await db.Article.findByPk(parseInt(req.params.id));
        if (!article) return next(new AppError('NOT_FOUND', 'Article not found', 404));

        if (article.author_id !== req.user.id && req.user.role !== 'admin') {
            return next(new AppError('FORBIDDEN', 'Not authorized to update this article', 403));
        }

        const allowed = ['title', 'content', 'summary', 'category', 'tags', 'cover_image', 'reading_time_min', 'author_name'];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        // Re-generate slug if title changed
        if (updates.title) updates.slug = buildSlug(updates.title);

        await article.update(updates);
        return sendSuccess(req, res, article);
    } catch (err) { return next(err); }
};

// DELETE /articles/:id — auth, archive
const deleteArticle = async (req, res, next) => {
    try {
        const article = await db.Article.findByPk(parseInt(req.params.id));
        if (!article) return next(new AppError('NOT_FOUND', 'Article not found', 404));

        if (article.author_id !== req.user.id && req.user.role !== 'admin') {
            return next(new AppError('FORBIDDEN', 'Not authorized', 403));
        }

        await article.update({ status: 'archived' });
        return sendSuccess(req, res, { message: 'Article archived' });
    } catch (err) { return next(err); }
};

// POST /articles/:id/publish — auth
const publishArticle = async (req, res, next) => {
    try {
        const article = await db.Article.findByPk(parseInt(req.params.id));
        if (!article) return next(new AppError('NOT_FOUND', 'Article not found', 404));

        if (article.author_id !== req.user.id && req.user.role !== 'admin') {
            return next(new AppError('FORBIDDEN', 'Not authorized', 403));
        }

        await article.update({ status: 'published', published_at: new Date() });
        return sendSuccess(req, res, article);
    } catch (err) { return next(err); }
};

// POST /articles/:id/like — auth
const likeArticle = async (req, res, next) => {
    try {
        const articleId = parseInt(req.params.id);
        const article = await db.Article.findByPk(articleId);
        if (!article) return next(new AppError('NOT_FOUND', 'Article not found', 404));

        const [vote, created] = await db.Vote.findOrCreate({
            where: { user_id: req.user.id, target_type: 'article', target_id: articleId },
            defaults: { user_id: req.user.id, target_type: 'article', target_id: articleId, value: 1 },
        });

        if (!created && vote.value === 1) {
            // Already liked — remove like
            await vote.destroy();
            await article.decrement('likes_count');
            return sendSuccess(req, res, { liked: false, likes_count: article.likes_count - 1 });
        }

        if (!created) {
            await vote.update({ value: 1 });
        }

        await article.increment('likes_count');
        return sendSuccess(req, res, { liked: true, likes_count: article.likes_count + 1 });
    } catch (err) { return next(err); }
};

module.exports = { listArticles, createArticle, getArticle, updateArticle, deleteArticle, publishArticle, likeArticle };
