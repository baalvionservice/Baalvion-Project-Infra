'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');

const listPages = async ({ page, limit }) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await db.Page.findAndCountAll({
        where: { status: 'published' },
        order: [['order_index', 'ASC'], ['published_at', 'DESC']],
        limit,
        offset,
        attributes: { exclude: ['content'] },
    });
    return { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
};

const createPage = async (userId, data) => {
    const existing = await db.Page.findOne({ where: { slug: data.slug } });
    if (existing) throw new AppError('CONFLICT', 'Slug already in use', 409);
    return db.Page.create({ ...data, created_by: userId });
};

const getPageBySlug = async (slug) => {
    const page = await db.Page.findOne({ where: { slug, status: 'published' } });
    if (!page) throw new AppError('NOT_FOUND', 'Page not found', 404);
    await page.increment('views_count');
    return page;
};

const getPageById = async (id) => {
    const page = await db.Page.findByPk(id);
    if (!page) throw new AppError('NOT_FOUND', 'Page not found', 404);
    return page;
};

const updatePage = async (id, data) => {
    const page = await db.Page.findByPk(id);
    if (!page) throw new AppError('NOT_FOUND', 'Page not found', 404);
    if (data.slug && data.slug !== page.slug) {
        const existing = await db.Page.findOne({ where: { slug: data.slug } });
        if (existing) throw new AppError('CONFLICT', 'Slug already in use', 409);
    }
    await page.update(data);
    return page;
};

const deletePage = async (id) => {
    const page = await db.Page.findByPk(id);
    if (!page) throw new AppError('NOT_FOUND', 'Page not found', 404);
    await page.destroy();
};

const publishPage = async (id) => {
    const page = await db.Page.findByPk(id);
    if (!page) throw new AppError('NOT_FOUND', 'Page not found', 404);
    if (page.status === 'published') throw new AppError('CONFLICT', 'Page already published', 409);
    await page.update({ status: 'published', published_at: new Date() });
    return page;
};

module.exports = { listPages, createPage, getPageBySlug, getPageById, updatePage, deletePage, publishPage };
