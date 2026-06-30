'use strict';
const { CmsAuthor } = require('../models');
const { AppError } = require('../utils/errors');
const { slugify } = require('../utils/slugify');

async function listAuthors(websiteId) {
    const authors = await CmsAuthor.findAll({
        where: { websiteId },
        order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });
    return authors.map((a) => a.toJSON());
}

async function createAuthor(websiteId, body) {
    const slug = body.slug || slugify(body.name);

    const existing = await CmsAuthor.findOne({ where: { websiteId, slug } });
    if (existing) throw new AppError('CONFLICT', 'An author with this slug already exists in this website', 409);

    const author = await CmsAuthor.create({
        websiteId,
        slug,
        name: body.name,
        title: body.title ?? null,
        credentials: body.credentials ?? null,
        bio: body.bio ?? null,
        avatarUrl: body.avatarUrl ?? null,
        expertise: body.expertise || [],
        social: body.social || {},
        seoMetadata: body.seoMetadata || {},
        sortOrder: body.sortOrder || 0,
        status: 'active',
        contentCount: 0,
    });
    return author.toJSON();
}

async function updateAuthor(websiteId, authorId, body) {
    const author = await CmsAuthor.findOne({ where: { id: authorId, websiteId } });
    if (!author) throw new AppError('NOT_FOUND', 'Author not found', 404);

    if (body.slug && body.slug !== author.slug) {
        const clash = await CmsAuthor.findOne({ where: { websiteId, slug: body.slug } });
        if (clash) throw new AppError('CONFLICT', 'An author with this slug already exists in this website', 409);
    }

    await author.update(body);
    return author.toJSON();
}

async function deleteAuthor(websiteId, authorId) {
    const author = await CmsAuthor.findOne({ where: { id: authorId, websiteId } });
    if (!author) throw new AppError('NOT_FOUND', 'Author not found', 404);
    await author.destroy();
}

module.exports = { listAuthors, createAuthor, updateAuthor, deleteAuthor };
