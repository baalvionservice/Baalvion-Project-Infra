'use strict';
const { Op } = require('sequelize');
const { hmacSign, safeCompare } = require('@baalvion/crypto');
const { CmsWebsite, CmsContent, CmsCategory, CmsTag, CmsAuthor, CmsContentEntityMention } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const config = require('../config/appConfig');
const contentService = require('./contentService');
const contentEvents = require('./analytics/contentEvents');
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
        void contentEvents.recordContentView(websiteSlug, cached); // fire-and-forget, fail-open
        return cached;
    }

    const website = await _resolveWebsite(websiteSlug);
    const content = await CmsContent.findOne({
        where: { websiteId: website.id, slug, status: 'published', visibility: 'public' },
        include: [
            { model: CmsCategory, as: 'category', attributes: ['id', 'name', 'slug'] },
            // Pre-resolved entity-link data (see contentEntityMentionsService.js) —
            // rides this same cached fetch rather than a second render-time call.
            // 'rejected'/'suggested' rows (future editor-review states) stay invisible
            // to the public API by construction.
            {
                model: CmsContentEntityMention, as: 'entityMentions', where: { status: 'accepted' }, required: false,
                attributes: ['entityType', 'entitySlug', 'entityName', 'entityUrl', 'matchedText'],
            },
        ],
    });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);

    const data = content.toJSON();
    await cache.set(cacheKey, data, config.cache.publicTtl);
    await contentService.incrementViewCount(content.id);
    void contentEvents.recordContentView(websiteSlug, data); // fire-and-forget, fail-open
    return data;
}

/**
 * Draft-safe content fetch for the admin CMS live-preview iframe. Gated by a short-lived
 * HMAC token (issued via contentService.getPreviewToken) instead of user auth, so the
 * target site's own frontend can call this without ever holding CMS_PREVIEW_SECRET.
 * Unlike getPublicContent, this ignores status/visibility — previewing drafts is the point.
 */
async function getPreviewContent(websiteSlug, slug, exp, token) {
    if (!config.preview.secret) throw new AppError('FORBIDDEN', 'Preview is not configured', 403);
    if (!exp || !token) throw new AppError('FORBIDDEN', 'Invalid preview token', 403);
    if (Date.now() > Number(exp)) throw new AppError('FORBIDDEN', 'Preview token expired', 403);

    const expected = hmacSign(`${websiteSlug}:${slug}:${exp}`, config.preview.secret);
    if (!safeCompare(expected, String(token))) {
        throw new AppError('FORBIDDEN', 'Invalid preview token', 403);
    }

    const website = await _resolveWebsite(websiteSlug);
    const content = await CmsContent.findOne({
        where: { websiteId: website.id, slug },
        include: [{ model: CmsCategory, as: 'category', attributes: ['id', 'name', 'slug'] }],
    });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);
    return content.toJSON();
}

// Query-string booleans arrive as strings ("true"/"1") — only an explicit truthy
// value should filter; absence must mean "don't filter", not "require false".
function _isTruthyParam(v) {
    return v === 'true' || v === '1' || v === true;
}

async function listPublicContent(websiteSlug, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const {
        categorySlug, tag, search, contentType, authorSlug,
        featured, breaking, trending, editorsPick, premium, label, sort,
    } = query;

    const website = await _resolveWebsite(websiteSlug);
    const where = { websiteId: website.id, status: 'published', visibility: 'public' };

    if (contentType) where.contentType = contentType;
    // Homepage-section filters — lets the frontend fetch "Breaking News" / "Trending
    // Now" / "Featured Articles" / "Editor's Pick" / "Premium" as real CMS queries
    // instead of a hardcoded slug list (see imperialpedia-dynamic-content-directive).
    if (_isTruthyParam(featured)) where.isFeatured = true;
    if (_isTruthyParam(breaking)) where.isBreaking = true;
    if (_isTruthyParam(trending)) where.isTrending = true;
    if (_isTruthyParam(editorsPick)) where.isEditorsPick = true;
    if (_isTruthyParam(premium)) where.isPremium = true;
    if (label) where.newsLabels = { [Op.contains]: [label] };
    // Content references an author profile via customFields.authorSlug (see cmsAuthor.js).
    // `where.customFields = { authorSlug }` would compare the WHOLE jsonb column for
    // equality against `{authorSlug}` — customFields always has other keys too (faq,
    // author, editorialTeam, ...), so that never matched and author-filtered listings
    // (e.g. "more from this author") silently returned zero results. The dot-path key
    // is Sequelize's documented syntax for a JSONB `->>` field match on Postgres.
    if (authorSlug) where['customFields.authorSlug'] = authorSlug;
    if (search) {
        where[Op.or] = [
            { title: { [Op.iLike]: `%${search}%` } },
            { excerpt: { [Op.iLike]: `%${search}%` } },
        ];
    }

    const includes = [{ model: CmsCategory, as: 'category', attributes: ['id', 'name', 'slug'] }];

    if (categorySlug) {
        const cat = await CmsCategory.findOne({ where: { websiteId: website.id, slug: categorySlug } });
        if (cat) {
            // Surface content whose primary OR additional categories include this one,
            // so a multi-category article appears on every relevant topic page.
            where[Op.and] = [
                ...(where[Op.and] || []),
                { [Op.or]: [{ categoryId: cat.id }, { categoryIds: { [Op.contains]: [cat.id] } }] },
            ];
        } else {
            // An unrecognized categorySlug must never fall through to an unfiltered,
            // site-wide query — that silently served every topic page the wrong
            // (site-wide "most recent") articles instead of an honest empty result,
            // masking missing categories as if they were populated with real content.
            return buildPaginated([], 0, { page, limit });
        }
    }

    // sort=views powers "Most Read"/"Trending Now" ranking by real traffic instead
    // of a curated flag; default stays recency (publishedAt DESC).
    const order = sort === 'views' ? [['viewCount', 'DESC']] : [['publishedAt', 'DESC']];

    const { rows, count } = await CmsContent.findAndCountAll({
        where, include: includes,
        order,
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

// Public author/contributor profiles for E-E-A-T bylines and /author pages.
const AUTHOR_ATTRS = ['id', 'slug', 'name', 'title', 'credentials', 'bio', 'avatarUrl', 'videoUrl', 'expertise', 'social', 'seoMetadata'];

async function listPublicAuthors(websiteSlug) {
    const website = await _resolveWebsite(websiteSlug);
    const authors = await CmsAuthor.findAll({
        where: { websiteId: website.id, status: 'active' },
        attributes: AUTHOR_ATTRS,
        order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });
    return authors.map((a) => a.toJSON());
}

async function getPublicAuthor(websiteSlug, slug) {
    const website = await _resolveWebsite(websiteSlug);
    const author = await CmsAuthor.findOne({
        where: { websiteId: website.id, slug, status: 'active' },
        attributes: AUTHOR_ATTRS,
    });
    if (!author) throw new AppError('NOT_FOUND', 'Author not found', 404);
    return author.toJSON();
}

async function getPublicWebsiteInfo(websiteSlug) {
    const website = await _resolveWebsite(websiteSlug);
    const { id, name, slug, domain, description, config: cfg, branding, modules } = website.toJSON();
    return { id, name, slug, domain, description, config: cfg, branding, modules };
}

module.exports = { getPublicContent, getPreviewContent, listPublicContent, getPublicCategory, getPublicWebsiteInfo, listPublicAuthors, getPublicAuthor };
