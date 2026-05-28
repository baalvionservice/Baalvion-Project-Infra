'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');

const listNewsPosts = async ({ page, limit, category, tag }) => {
    const offset = (page - 1) * limit;
    const where = { status: 'published' };
    if (category) where.category = category;
    if (tag) where.tags = { [Op.contains]: [tag] };

    const { count, rows } = await db.NewsPost.findAndCountAll({
        where,
        order: [['published_at', 'DESC']],
        limit,
        offset,
        attributes: { exclude: ['content'] },
    });
    return { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
};

const createNewsPost = async (authorId, data) => {
    const existing = await db.NewsPost.findOne({ where: { slug: data.slug } });
    if (existing) throw new AppError('CONFLICT', 'Slug already in use', 409);
    return db.NewsPost.create({ ...data, author_id: authorId });
};

const getPostBySlug = async (slug) => {
    const post = await db.NewsPost.findOne({ where: { slug, status: 'published' } });
    if (!post) throw new AppError('NOT_FOUND', 'Post not found', 404);
    await post.increment('views_count');
    return post;
};

const getPostById = async (id) => {
    const post = await db.NewsPost.findByPk(id);
    if (!post) throw new AppError('NOT_FOUND', 'Post not found', 404);
    return post;
};

const updatePost = async (id, data) => {
    const post = await db.NewsPost.findByPk(id);
    if (!post) throw new AppError('NOT_FOUND', 'Post not found', 404);
    if (data.slug && data.slug !== post.slug) {
        const existing = await db.NewsPost.findOne({ where: { slug: data.slug } });
        if (existing) throw new AppError('CONFLICT', 'Slug already in use', 409);
    }
    await post.update(data);
    return post;
};

const deletePost = async (id) => {
    const post = await db.NewsPost.findByPk(id);
    if (!post) throw new AppError('NOT_FOUND', 'Post not found', 404);
    await post.destroy();
};

const publishPost = async (id) => {
    const post = await db.NewsPost.findByPk(id);
    if (!post) throw new AppError('NOT_FOUND', 'Post not found', 404);
    if (post.status === 'published') throw new AppError('CONFLICT', 'Post already published', 409);
    await post.update({ status: 'published', published_at: new Date() });
    return post;
};

module.exports = { listNewsPosts, createNewsPost, getPostBySlug, getPostById, updatePost, deletePost, publishPost };
