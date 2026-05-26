'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const slugify = (text) =>
    text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const listArticles = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, alphabet, categoryId, subcategoryId, search, sortBy, order = 'desc', status } = req.query;
        const where = {};

        if (status) {
            where.status = status;
        } else {
            where.status = 'published';
        }

        if (alphabet) where.alphabet = alphabet.toUpperCase().charAt(0);
        if (categoryId) where.category_id = Number(categoryId);
        if (subcategoryId) where.subcategory_id = Number(subcategoryId);
        if (search) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { content: { [Op.iLike]: `%${search}%` } },
                { excerpt: { [Op.iLike]: `%${search}%` } },
            ];
        }

        const validSortFields = { views: 'views', title: 'title', published_at: 'published_at', created_at: 'created_at' };
        const sortField = validSortFields[sortBy] || 'published_at';
        const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Article.findAndCountAll({
            where,
            attributes: { exclude: ['content'] },
            order: [[sortField, sortOrder]],
            limit: Math.min(Number(limit), 200),
            offset,
        });

        return sendPaginated(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit: Number(limit), totalPages: Math.ceil(count / Number(limit)) },
        });
    } catch (err) { return next(err); }
};

const getArticle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const where = isNaN(id) ? { slug: id } : { id: Number(id) };
        const article = await db.Article.findOne({
            where,
            include: [
                { model: db.Category, as: 'category', attributes: ['id', 'name', 'slug'] },
                { model: db.Subcategory, as: 'subcategory', attributes: ['id', 'name', 'slug'] },
            ],
        });
        if (!article) return next(new AppError('NOT_FOUND', 'Article not found', 404));
        if (article.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
            return next(new AppError('NOT_FOUND', 'Article not found', 404));
        }
        await article.increment('views');
        return sendSuccess(req, res, article);
    } catch (err) { return next(err); }
};

const createArticle = async (req, res, next) => {
    try {
        const { title, content, excerpt, category_id, subcategory_id, tags, status } = req.body;
        if (!title) return next(new AppError('BAD_REQUEST', 'title is required', 400));
        let slug = slugify(title);
        const existing = await db.Article.findOne({ where: { slug } });
        if (existing) slug = `${slug}-${Date.now()}`;
        const alphabet = title.trim().toUpperCase().charAt(0).match(/[A-Z]/) ? title.trim().toUpperCase().charAt(0) : '#';
        const article = await db.Article.create({
            author_id: req.user.id,
            title,
            slug,
            content: content || '',
            excerpt: excerpt || '',
            alphabet,
            category_id: category_id || null,
            subcategory_id: subcategory_id || null,
            tags: tags || [],
            status: status || 'draft',
            published_at: status === 'published' ? new Date() : null,
        });
        return sendSuccess(req, res, article, 201);
    } catch (err) { return next(err); }
};

const updateArticle = async (req, res, next) => {
    try {
        const article = await db.Article.findByPk(req.params.id);
        if (!article) return next(new AppError('NOT_FOUND', 'Article not found', 404));
        if (article.author_id !== req.user.id && req.user.role !== 'admin') {
            return next(new AppError('FORBIDDEN', 'Not authorised', 403));
        }
        delete req.body.slug;
        delete req.body.author_id;
        if (req.body.title && req.body.title !== article.title) {
            req.body.alphabet = req.body.title.trim().toUpperCase().charAt(0).match(/[A-Z]/) ? req.body.title.trim().toUpperCase().charAt(0) : '#';
        }
        await article.update(req.body);
        return sendSuccess(req, res, article);
    } catch (err) { return next(err); }
};

const publishArticle = async (req, res, next) => {
    try {
        const article = await db.Article.findByPk(req.params.id);
        if (!article) return next(new AppError('NOT_FOUND', 'Article not found', 404));
        if (article.author_id !== req.user.id && req.user.role !== 'admin') {
            return next(new AppError('FORBIDDEN', 'Not authorised', 403));
        }
        await article.update({ status: 'published', published_at: new Date() });
        return sendSuccess(req, res, article);
    } catch (err) { return next(err); }
};

const archiveArticle = async (req, res, next) => {
    try {
        const article = await db.Article.findByPk(req.params.id);
        if (!article) return next(new AppError('NOT_FOUND', 'Article not found', 404));
        if (req.user.role !== 'admin') return next(new AppError('FORBIDDEN', 'Admin only', 403));
        await article.update({ status: 'archived' });
        return sendSuccess(req, res, article);
    } catch (err) { return next(err); }
};

module.exports = { listArticles, getArticle, createArticle, updateArticle, publishArticle, archiveArticle };
