'use strict';
const { Op, fn, col, literal } = require('sequelize');
const { CmsAuthor, CmsContent, CmsAuthorMessage } = require('../models');
const { AppError } = require('../utils/errors');
const { slugify } = require('../utils/slugify');
const { parsePagination, buildPaginated } = require('../utils/pagination');

// Content links to an author profile only loosely, via customFields.authorSlug (there is
// no FK — see cmsAuthor.js) — so unlike categories/tags, contentCount can't be kept in
// sync incrementally without duplicating that JSONB-matching logic on every content write.
// Computing it at read time from a GROUP BY is simple and can never drift out of sync.
async function _contentCountsBySlug(websiteId) {
    const authorSlugExpr = literal(`"custom_fields"->>'authorSlug'`);
    const rows = await CmsContent.findAll({
        attributes: [[authorSlugExpr, 'authorSlug'], [fn('COUNT', col('id')), 'count']],
        where: { websiteId, [Op.and]: [literal(`"custom_fields"->>'authorSlug' IS NOT NULL`)] },
        group: [authorSlugExpr],
        raw: true,
    });
    return new Map(rows.map((r) => [r.authorSlug, Number(r.count)]));
}

async function listAuthors(websiteId) {
    const authors = await CmsAuthor.findAll({
        where: { websiteId },
        order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });
    const counts = await _contentCountsBySlug(websiteId);
    return authors.map((a) => ({ ...a.toJSON(), contentCount: counts.get(a.slug) ?? 0 }));
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
        videoUrl: body.videoUrl ?? null,
        expertise: body.expertise || [],
        education: body.education || [],
        certifications: body.certifications || [],
        editorialRole: body.editorialRole ?? null,
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

/** Admin console — "Contact the Author" submissions for this website, newest first. */
async function listAuthorMessages(websiteId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = { websiteId };
    if (query.status === 'unread' || query.status === 'read') where.status = query.status;
    const { rows, count } = await CmsAuthorMessage.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
    });
    return buildPaginated(rows.map((r) => r.toJSON()), count, { page, limit });
}

async function markAuthorMessageRead(websiteId, messageId, status) {
    const message = await CmsAuthorMessage.findOne({ where: { id: messageId, websiteId } });
    if (!message) throw new AppError('NOT_FOUND', 'Message not found', 404);
    await message.update({ status });
    return message.toJSON();
}

module.exports = { listAuthors, createAuthor, updateAuthor, deleteAuthor, listAuthorMessages, markAuthorMessageRead };
