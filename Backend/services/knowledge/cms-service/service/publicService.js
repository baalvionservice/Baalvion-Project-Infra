'use strict';
const { Op } = require('sequelize');
const { CmsWebsite, CmsContent, CmsCategory, CmsTag } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const config = require('../config/appConfig');
const contentService = require('./contentService');
const { parsePagination, buildPaginated } = require('../utils/pagination');

async function _resolveWebsite(websiteSlug) {
    const website = await CmsWebsite.findOne({ where: { slug: websiteSlug, status: 'active' } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);
    return website;
}

async function getPublicContent(websiteSlug, slug) {
    const cacheKey = cache.keys.publicContent(websiteSlug, slug);
    const cached = await cache.get(cacheKey);
    if (cached) {
        await contentService.incrementViewCount(cached.id);
        return cached;
    }

    const website = await _resolveWebsite(websiteSlug);
    const content = await CmsContent.findOne({
        where: { websiteId: website.id, slug, status: 'published', visibility: 'public' },
        include: [{ model: CmsCategory, as: 'category', attributes: ['id', 'name', 'slug'] }],
    });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);

    const data = content.toJSON();
    await cache.set(cacheKey, data, config.cache.publicTtl);
    await contentService.incrementViewCount(content.id);
    return data;
}

async function listPublicContent(websiteSlug, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const { categorySlug, tag, search, contentType } = query;

    const website = await _resolveWebsite(websiteSlug);
    const where = { websiteId: website.id, status: 'published', visibility: 'public' };

    if (contentType) where.contentType = contentType;
    if (search) {
        where[Op.or] = [
            { title: { [Op.iLike]: `%${search}%` } },
            { excerpt: { [Op.iLike]: `%${search}%` } },
        ];
    }

    const includes = [{ model: CmsCategory, as: 'category', attributes: ['id', 'name', 'slug'] }];

    if (categorySlug) {
        const cat = await CmsCategory.findOne({ where: { websiteId: website.id, slug: categorySlug } });
        if (cat) where.categoryId = cat.id;
    }

    const { rows, count } = await CmsContent.findAndCountAll({
        where, include: includes,
        order: [['publishedAt', 'DESC']],
        // Expose customFields so headless frontends can render list/card views
        // (status badges, layers, priorities, etc.). contentBlocks stays excluded
        // for list performance — fetch a single item for the full body.
        attributes: { exclude: ['contentBlocks'] },
        limit, offset,
    });

    return buildPaginated(rows, count, { page, limit });
}

async function getPublicCategory(websiteSlug, categorySlug) {
    const website = await _resolveWebsite(websiteSlug);
    const category = await CmsCategory.findOne({ where: { websiteId: website.id, slug: categorySlug, status: 'active' } });
    if (!category) throw new AppError('NOT_FOUND', 'Category not found', 404);
    return category.toJSON();
}

async function getPublicWebsiteInfo(websiteSlug) {
    const website = await _resolveWebsite(websiteSlug);
    const { id, name, slug, domain, description, config: cfg, branding, modules } = website.toJSON();
    return { id, name, slug, domain, description, config: cfg, branding, modules };
}

module.exports = { getPublicContent, listPublicContent, getPublicCategory, getPublicWebsiteInfo };
