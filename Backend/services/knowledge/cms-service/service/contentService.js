'use strict';
const { Op } = require('sequelize');
const { CmsContent, CmsCategory, CmsTag, CmsWorkflow, CmsContentRevision, CmsWebsite, sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const config = require('../config/appConfig');
const { slugify } = require('../utils/slugify');
const { parsePagination, buildPaginated } = require('../utils/pagination');

async function listContent(websiteId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const { status, contentType, categoryId, search, authorId } = query;

    const where = { websiteId };
    if (status) where.status = Array.isArray(status) ? { [Op.in]: status } : status;
    if (contentType) where.contentType = contentType;
    // Match content whose primary OR secondary categories include the filter id.
    if (categoryId) {
        where[Op.and] = [
            ...(where[Op.and] || []),
            { [Op.or]: [{ categoryId }, { categoryIds: { [Op.contains]: [categoryId] } }] },
        ];
    }
    if (authorId) where.authorId = authorId;
    if (search) {
        where[Op.or] = [
            { title: { [Op.iLike]: `%${search}%` } },
            { excerpt: { [Op.iLike]: `%${search}%` } },
        ];
    }

    const { rows, count } = await CmsContent.findAndCountAll({
        where, limit, offset,
        order: [['updatedAt', 'DESC']],
        attributes: { exclude: ['contentBlocks'] },
    });
    return buildPaginated(rows, count, { page, limit });
}

async function getContent(websiteId, contentId) {
    const cacheKey = cache.keys.content(contentId);
    const cached = await cache.get(cacheKey);
    if (cached && cached.websiteId === websiteId) return cached;

    const content = await CmsContent.findOne({
        where: { id: contentId, websiteId },
        include: [{ model: CmsWorkflow, as: 'workflow' }],
    });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);

    const data = content.toJSON();
    await cache.set(cacheKey, data, config.cache.contentTtl);
    return data;
}

// Find a slug that is unique within the website, appending -2, -3, ... on collision.
// This makes it impossible to error out when creating two items with the same title
// (e.g. two co-founders with identical names) — the slug is silently disambiguated.
async function _uniqueSlug(websiteId, base, excludeId = null) {
    const clean = (base && String(base).trim()) || 'item';
    let candidate = clean;
    for (let n = 2; n <= 1000; n++) {
        const where = { websiteId, slug: candidate };
        if (excludeId) where.id = { [Op.ne]: excludeId };
        const existing = await CmsContent.findOne({ where });
        if (!existing) return candidate;
        candidate = `${clean}-${n}`;
    }
    return `${clean}-${Date.now()}`;
}

async function createContent(websiteId, userId, body) {
    const { title, slug: rawSlug, categoryId, categoryIds, contentType, contentBlocks, tagIds, seoMetadata, visibility, scheduledAt, customFields, excerpt, featuredImage } = body;
    const slug = await _uniqueSlug(websiteId, rawSlug || slugify(title));

    // An article can sit in multiple categories. `cats` is the full deduped set;
    // `primaryCategoryId` (the first) stays in category_id for backwards compatibility.
    const cats = _normalizeCategoryIds(categoryIds, categoryId);
    const primaryCategoryId = cats[0] || null;

    if (cats.length) {
        const found = await CmsCategory.count({ where: { id: { [Op.in]: cats }, websiteId } });
        if (found !== cats.length) throw new AppError('NOT_FOUND', 'One or more categories not found', 404);
    }

    const content = await sequelize.transaction(async (t) => {
        const c = await CmsContent.create({
            websiteId, categoryId: primaryCategoryId, categoryIds: cats, authorId: userId, lastEditedBy: userId,
            title, slug, excerpt, featuredImage, contentType,
            contentBlocks, tagIds, seoMetadata, visibility,
            scheduledAt: scheduledAt || null, customFields,
            status: 'draft', revisionCount: 0, viewCount: 0,
        }, { transaction: t });

        await CmsWorkflow.create({ contentId: c.id, currentState: 'draft', submittedBy: userId }, { transaction: t });
        return c;
    });

    if (tagIds?.length) await _incrementTagUsage(websiteId, tagIds, 1);

    return content.toJSON();
}

async function updateContent(websiteId, contentId, userId, body) {
    const content = await CmsContent.findOne({ where: { id: contentId, websiteId } });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);

    // Published content can be edited in place — edits go live immediately (and the public
    // cache is busted below). Only archived content is locked; restore it to draft first.
    if (content.status === 'archived') {
        throw new AppError('FORBIDDEN', 'This content is archived. Restore it to a draft before editing.', 403);
    }

    if (body.slug && body.slug !== content.slug) {
        const existing = await CmsContent.findOne({ where: { websiteId, slug: body.slug, id: { [Op.ne]: contentId } } });
        if (existing) throw new AppError('CONFLICT', 'Content with this slug already exists', 409);
    }

    // Keep the multi-category array and the primary category_id in sync.
    if (body.categoryIds !== undefined) {
        body.categoryIds = _normalizeCategoryIds(body.categoryIds, null);
        body.categoryId = body.categoryIds[0] || null;
    } else if (body.categoryId !== undefined) {
        body.categoryIds = _normalizeCategoryIds(null, body.categoryId);
        body.categoryId = body.categoryIds[0] || null;
    }

    const oldTagIds = content.tagIds || [];
    await content.update({ ...body, lastEditedBy: userId });

    if (body.tagIds) {
        const removed = oldTagIds.filter((id) => !body.tagIds.includes(id));
        const added = body.tagIds.filter((id) => !oldTagIds.includes(id));
        if (removed.length) await _incrementTagUsage(websiteId, removed, -1);
        if (added.length) await _incrementTagUsage(websiteId, added, 1);
    }

    await cache.del(cache.keys.content(contentId));
    // If the edited item is live, bust the public delivery cache so the change appears
    // on the website immediately instead of waiting out the public TTL.
    if (content.status === 'published') {
        try {
            const website = await CmsWebsite.findByPk(websiteId, { attributes: ['slug'] });
            if (website?.slug) await cache.delPattern(`cms:public:${website.slug}:*`);
        } catch { /* fail-open */ }
    }
    return content.toJSON();
}

async function autosaveContent(websiteId, contentId, userId, body) {
    const content = await CmsContent.findOne({ where: { id: contentId, websiteId } });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);

    await content.update({ ...body, lastEditedBy: userId });
    await cache.del(cache.keys.content(contentId));
    return { savedAt: new Date().toISOString() };
}

async function deleteContent(websiteId, contentId) {
    const content = await CmsContent.findOne({ where: { id: contentId, websiteId } });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);

    if (content.status === 'published') {
        throw new AppError('FORBIDDEN', 'Cannot delete published content. Archive it first.', 403);
    }

    if (content.tagIds?.length) await _incrementTagUsage(websiteId, content.tagIds, -1);

    await content.destroy();
    await cache.del(cache.keys.content(contentId));
}

async function bulkUpdate(websiteId, userId, { ids, action, categoryId }) {
    const contents = await CmsContent.findAll({ where: { id: { [Op.in]: ids }, websiteId } });
    if (!contents.length) throw new AppError('NOT_FOUND', 'No content found for given IDs', 404);

    switch (action) {
        case 'archive':
            await CmsContent.update({ status: 'archived', lastEditedBy: userId }, { where: { id: { [Op.in]: ids }, websiteId } });
            break;
        case 'delete': {
            const publishedIds = contents.filter((c) => c.status === 'published').map((c) => c.id);
            if (publishedIds.length) throw new AppError('FORBIDDEN', 'Cannot bulk-delete published content. Archive first.', 403);
            await CmsContent.destroy({ where: { id: { [Op.in]: ids }, websiteId } });
            break;
        }
        case 'assign_category':
            if (!categoryId) throw new AppError('VALIDATION_ERROR', 'categoryId is required for assign_category action', 400);
            await CmsContent.update({ categoryId, lastEditedBy: userId }, { where: { id: { [Op.in]: ids }, websiteId } });
            break;
        default:
            throw new AppError('VALIDATION_ERROR', `Unknown bulk action: ${action}`, 400);
    }

    await Promise.all(ids.map((id) => cache.del(cache.keys.content(id))));
    return { updated: contents.length };
}

async function incrementViewCount(contentId) {
    await CmsContent.increment('viewCount', { where: { id: contentId } });
    await cache.del(cache.keys.content(contentId));
}

async function _incrementTagUsage(websiteId, tagIds, delta) {
    if (!tagIds.length) return;
    await CmsTag.increment('usageCount', { by: delta, where: { id: { [Op.in]: tagIds }, websiteId } });
    await cache.del(cache.keys.tagList(websiteId));
}

// Merge an explicit categoryIds array with the legacy single categoryId into one
// deduped, order-preserving array (the first element is treated as the primary).
function _normalizeCategoryIds(categoryIds, categoryId) {
    const source = Array.isArray(categoryIds) ? categoryIds : [];
    const merged = categoryId ? [categoryId, ...source] : source;
    return [...new Set(merged.filter(Boolean))];
}

module.exports = { listContent, getContent, createContent, updateContent, autosaveContent, deleteContent, bulkUpdate, incrementViewCount };
