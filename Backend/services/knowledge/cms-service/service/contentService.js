'use strict';
const path = require('path');
const { Op } = require('sequelize');
const { hmacSign } = require('@baalvion/crypto');
const { writeArticleArtFile } = require('@baalvion/illustrations');
const { CmsContent, CmsCategory, CmsTag, CmsWorkflow, CmsContentRevision, CmsSeoRedirect, CmsWebsite, sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const revalidateService = require('./revalidateService');
const config = require('../config/appConfig');
const { slugify } = require('../utils/slugify');
const { parsePagination, buildPaginated } = require('../utils/pagination');
const { UPLOAD_DIR, PUBLIC_BASE } = require('./mediaService');
const { logger } = require('../platform/logger');

// URL prefix used for auto-generated article artwork — also doubles as the marker
// that lets updateContent() tell "we generated this" apart from an editor's own
// upload, so regeneration on title/category change never clobbers a manual image.
const GENERATED_ART_PREFIX = '/uploads/generated-art/';

// Resolves the primary category name + tag names for keyword-based icon selection.
// Best-effort: falls back to empty values rather than failing content creation.
async function _artworkContext(cats, tagIds) {
    const [category, tags] = await Promise.all([
        cats[0] ? CmsCategory.findByPk(cats[0], { attributes: ['name'] }) : null,
        tagIds?.length ? CmsTag.findAll({ where: { id: { [Op.in]: tagIds } }, attributes: ['name'] }) : [],
    ]);
    return { categoryName: category?.name || null, tagNames: (tags || []).map((t) => t.name) };
}

function _generateArtwork({ id, title, excerpt, categoryName, tagNames }) {
    writeArticleArtFile(
        { title, category: categoryName, tags: tagNames, excerpt, seed: id },
        path.join(UPLOAD_DIR, 'generated-art', `${id}.svg`),
    );
    return `${PUBLIC_BASE}${GENERATED_ART_PREFIX}${id}.svg`;
}

const WORDS_PER_MINUTE = 200;

// Best-effort text extraction from block content — pulls the common text-bearing
// fields off each block type rather than requiring a full block-type switch.
function _extractBlockText(block) {
    const c = block?.content;
    if (!c) return '';
    return [c.text, c.caption, c.title, c.subtitle].filter((v) => typeof v === 'string').join(' ');
}

function _estimateReadingTime(contentBlocks) {
    const wordCount = (contentBlocks || [])
        .map(_extractBlockText)
        .join(' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
    return wordCount ? Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)) : null;
}

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
    // Match each word independently (title OR excerpt, any order) rather than the whole
    // query as one contiguous substring — a title like "Dollar-Cost Averaging Explained"
    // would never match a phrase search for "what is dollar cost averaging" otherwise,
    // since punctuation, word order, and filler words rarely line up exactly.
    if (search) {
        const terms = search.trim().split(/\s+/).filter(Boolean);
        if (terms.length) {
            where[Op.and] = [
                ...(where[Op.and] || []),
                ...terms.map((term) => ({
                    [Op.or]: [
                        { title: { [Op.iLike]: `%${term}%` } },
                        { excerpt: { [Op.iLike]: `%${term}%` } },
                    ],
                })),
            ];
        }
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

/**
 * Issues a short-lived HMAC token scoped to this content's website+slug, for the admin
 * CMS live-preview iframe. The token (not the underlying CMS_PREVIEW_SECRET) is what
 * reaches the browser and the target site — only cms-service ever holds the secret.
 */
async function getPreviewToken(websiteId, contentId) {
    if (!config.preview.secret) throw new AppError('FORBIDDEN', 'Preview is not configured', 403);

    const content = await CmsContent.findOne({ where: { id: contentId, websiteId }, attributes: ['id', 'slug'] });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);

    const website = await CmsWebsite.findByPk(websiteId, { attributes: ['slug', 'domain'] });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);

    const exp = Date.now() + config.preview.ttlMs;
    const token = hmacSign(`${website.slug}:${content.slug}:${exp}`, config.preview.secret);
    return { slug: content.slug, domain: website.domain, exp, token };
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

// Renaming a published slug breaks every existing internal link, external
// backlink, and search-engine index entry pointing at the old URL unless
// something remembers where it moved. `cms_seo_redirects` exists for exactly
// this (see models/cmsSeoRedirect.js) but nothing ever wrote to it — this is
// that missing write side. The public delivery layer (publicService) reads it
// back on a 404 lookup miss.
//
// Also collapses redirect chains: if this slug was itself the target of an
// earlier redirect (A renamed to B, now B renames to C), that older row is
// repointed straight at the new slug so a visitor following the original link
// never hops through two redirects.
async function _recordSlugRedirect(websiteId, oldSlug, newSlug) {
    if (!oldSlug || !newSlug || oldSlug === newSlug) return;

    const [redirect] = await CmsSeoRedirect.findOrCreate({
        where: { websiteId, sourceUrl: oldSlug },
        defaults: { targetUrl: newSlug, redirectType: '301', isActive: true },
    });
    if (redirect.targetUrl !== newSlug || !redirect.isActive) {
        await redirect.update({ targetUrl: newSlug, isActive: true });
    }

    await CmsSeoRedirect.update(
        { targetUrl: newSlug },
        { where: { websiteId, targetUrl: oldSlug } },
    );
}

async function createContent(websiteId, userId, body) {
    const {
        title, slug: rawSlug, categoryId, categoryIds, contentType, contentBlocks, tagIds, seoMetadata,
        visibility, scheduledAt, customFields, excerpt, featuredImage, galleryImages, videoUrl,
        readingTimeMinutes, isFeatured, isBreaking, isTrending, isEditorsPick, isPremium,
        newsLabels, externalSourceName, externalSourceUrl,
    } = body;
    const slug = await _uniqueSlug(websiteId, rawSlug || slugify(title));
    const readingTime = readingTimeMinutes ?? _estimateReadingTime(contentBlocks);

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
            galleryImages: galleryImages || [], videoUrl: videoUrl || null, readingTimeMinutes: readingTime,
            isFeatured: !!isFeatured, isBreaking: !!isBreaking, isTrending: !!isTrending,
            isEditorsPick: !!isEditorsPick, isPremium: !!isPremium, newsLabels: newsLabels || [],
            externalSourceName: externalSourceName || null, externalSourceUrl: externalSourceUrl || null,
            status: 'draft', revisionCount: 0, viewCount: 0,
        }, { transaction: t });

        // The CMS must never fall back to stock/placeholder imagery — if the author
        // didn't attach a featured image, generate original branded artwork from the
        // article's own title/category/tags instead (see @baalvion/illustrations).
        if (!featuredImage) {
            const { categoryName, tagNames } = await _artworkContext(cats, tagIds);
            const generatedUrl = _generateArtwork({ id: c.id, title, excerpt, categoryName, tagNames });
            await c.update({ featuredImage: generatedUrl }, { transaction: t });
        }

        await CmsWorkflow.create({ contentId: c.id, currentState: 'draft', submittedBy: userId }, { transaction: t });
        return c;
    });

    if (tagIds?.length) await _incrementTagUsage(websiteId, tagIds, 1);
    if (cats.length) await _incrementCategoryCount(websiteId, cats, 1);

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

    const slugChanged = Boolean(body.slug && body.slug !== content.slug);
    const oldSlug = content.slug;

    if (slugChanged) {
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
    const oldCategoryIds = content.categoryIds || [];

    // Regenerate auto-generated artwork when the title or category changes so the
    // image keeps matching the content — but only when the current image is one we
    // generated (empty, or under the generated-art prefix). An editor's manually
    // uploaded featuredImage is never touched, and an explicit featuredImage in this
    // same update always wins over regeneration.
    const isOurArtwork = !content.featuredImage || content.featuredImage.includes(GENERATED_ART_PREFIX);
    const titleChanged = body.title !== undefined && body.title !== content.title;
    const categoryChanged = body.categoryId !== undefined && body.categoryId !== content.categoryId;
    if (body.featuredImage === undefined && isOurArtwork && (titleChanged || categoryChanged)) {
        const { categoryName, tagNames } = await _artworkContext(
            body.categoryIds ?? content.categoryIds ?? [],
            body.tagIds ?? content.tagIds ?? [],
        );
        body.featuredImage = _generateArtwork({
            id: content.id,
            title: body.title ?? content.title,
            excerpt: body.excerpt ?? content.excerpt,
            categoryName,
            tagNames,
        });
    }

    // Only recompute reading time from body when the editor changed the body but
    // didn't explicitly set a reading time themselves (an explicit value always wins).
    if (body.contentBlocks !== undefined && body.readingTimeMinutes === undefined) {
        body.readingTimeMinutes = _estimateReadingTime(body.contentBlocks);
    }

    await content.update({ ...body, lastEditedBy: userId });

    if (slugChanged) {
        // Bookkeeping only — a failure here must never fail the rename itself.
        try {
            await _recordSlugRedirect(websiteId, oldSlug, content.slug);
        } catch (err) {
            try { logger('content').warn({ err, contentId, oldSlug, newSlug: content.slug }, 'failed to record slug redirect'); } catch { /* logging must never throw */ }
        }
    }

    if (body.tagIds) {
        const removed = oldTagIds.filter((id) => !body.tagIds.includes(id));
        const added = body.tagIds.filter((id) => !oldTagIds.includes(id));
        if (removed.length) await _incrementTagUsage(websiteId, removed, -1);
        if (added.length) await _incrementTagUsage(websiteId, added, 1);
    }

    if (body.categoryIds) {
        const removedCats = oldCategoryIds.filter((id) => !body.categoryIds.includes(id));
        const addedCats = body.categoryIds.filter((id) => !oldCategoryIds.includes(id));
        if (removedCats.length) await _incrementCategoryCount(websiteId, removedCats, -1);
        if (addedCats.length) await _incrementCategoryCount(websiteId, addedCats, 1);
    }

    await cache.del(cache.keys.content(contentId));
    // If the edited item is live, bust the public delivery cache so the change appears
    // on the website immediately instead of waiting out the public TTL.
    if (content.status === 'published') {
        try {
            const website = await CmsWebsite.findByPk(websiteId, { attributes: ['slug', 'domain'] });
            if (website?.slug) {
                await cache.delPattern(`cms:public:${website.slug}:*`);
                // Revalidate the website's build-cached (ISR) pages so the live edit
                // appears immediately. Fire-and-forget; never blocks the response.
                const { paths, urls } = await revalidateService.pathsForContent(content, website.domain);
                revalidateService.dispatch(website.slug, { paths, urls });
            }
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

// Clones an article as a new draft — copies every editorial field but never the
// original's publish state (starts back at draft, publishedAt/scheduledAt cleared)
// so a duplicate can never accidentally appear live under a colliding slug.
async function duplicateContent(websiteId, contentId, userId) {
    const source = await CmsContent.findOne({ where: { id: contentId, websiteId } });
    if (!source) throw new AppError('NOT_FOUND', 'Content not found', 404);

    const src = source.toJSON();
    const slug = await _uniqueSlug(websiteId, `${src.slug}-copy`);

    const clone = await sequelize.transaction(async (t) => {
        const c = await CmsContent.create({
            websiteId, categoryId: src.categoryId, categoryIds: src.categoryIds, authorId: userId, lastEditedBy: userId,
            title: `${src.title} (Copy)`, slug, excerpt: src.excerpt, featuredImage: src.featuredImage,
            galleryImages: src.galleryImages, videoUrl: src.videoUrl, readingTimeMinutes: src.readingTimeMinutes,
            contentType: src.contentType, contentBlocks: src.contentBlocks, tagIds: src.tagIds, seoMetadata: src.seoMetadata,
            visibility: src.visibility, customFields: src.customFields,
            isFeatured: false, isBreaking: false, isTrending: false, isEditorsPick: src.isEditorsPick, isPremium: src.isPremium,
            newsLabels: src.newsLabels, externalSourceName: src.externalSourceName, externalSourceUrl: src.externalSourceUrl,
            status: 'draft', scheduledAt: null, publishedAt: null, revisionCount: 0, viewCount: 0,
        }, { transaction: t });
        await CmsWorkflow.create({ contentId: c.id, currentState: 'draft', submittedBy: userId }, { transaction: t });
        return c;
    });

    if (src.tagIds?.length) await _incrementTagUsage(websiteId, src.tagIds, 1);
    if (src.categoryIds?.length) await _incrementCategoryCount(websiteId, src.categoryIds, 1);

    return clone.toJSON();
}

async function deleteContent(websiteId, contentId) {
    const content = await CmsContent.findOne({ where: { id: contentId, websiteId } });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);

    if (content.status === 'published') {
        throw new AppError('FORBIDDEN', 'Cannot delete published content. Archive it first.', 403);
    }

    if (content.tagIds?.length) await _incrementTagUsage(websiteId, content.tagIds, -1);
    if (content.categoryIds?.length) await _incrementCategoryCount(websiteId, content.categoryIds, -1);

    await content.destroy();
    await cache.del(cache.keys.content(contentId));
}

async function bulkUpdate(websiteId, userId, { ids, action, categoryId }) {
    const contents = await CmsContent.findAll({ where: { id: { [Op.in]: ids }, websiteId } });
    if (!contents.length) throw new AppError('NOT_FOUND', 'No content found for given IDs', 404);

    // Snapshot pre-action status: archive/delete/recategorize all change what the
    // public site should show for anything that was live, and hub pages embedding
    // these articles need to refresh the same way a single-item edit already does.
    const wasPublished = contents.filter((c) => c.status === 'published');

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
        case 'assign_category': {
            if (!categoryId) throw new AppError('VALIDATION_ERROR', 'categoryId is required for assign_category action', 400);
            const targetExists = await CmsCategory.count({ where: { id: categoryId, websiteId } });
            if (!targetExists) throw new AppError('NOT_FOUND', 'Category not found', 404);

            const changing = contents.filter((c) => c.categoryId !== categoryId);
            await CmsContent.update({ categoryId, lastEditedBy: userId }, { where: { id: { [Op.in]: ids }, websiteId } });

            await Promise.all(
                changing.filter((c) => c.categoryId).map((c) => _incrementCategoryCount(websiteId, [c.categoryId], -1)),
            );
            if (changing.length) await _incrementCategoryCount(websiteId, [categoryId], changing.length);
            break;
        }
        default:
            throw new AppError('VALIDATION_ERROR', `Unknown bulk action: ${action}`, 400);
    }

    await Promise.all(ids.map((id) => cache.del(cache.keys.content(id))));

    // Mirror updateContent()'s public-cache-bust + ISR-revalidate for anything that
    // was live before this bulk action, so category/hub pages don't keep serving
    // stale links to now-archived, deleted, or recategorized articles.
    if (wasPublished.length) {
        try {
            const website = await CmsWebsite.findByPk(websiteId, { attributes: ['slug', 'domain'] });
            if (website?.slug) {
                await cache.delPattern(`cms:public:${website.slug}:*`);
                for (const content of wasPublished) {
                    const { paths, urls } = await revalidateService.pathsForContent(content, website.domain);
                    revalidateService.dispatch(website.slug, { paths, urls });
                }
            }
        } catch { /* fail-open */ }
    }

    return { updated: contents.length };
}

// Lower CMS roles (contributor/author) can't DELETE (requires cms_editor+ at the route),
// so this is their alternative: flag content for an editor/admin to review and act on.
// Additive-only — never mutates status or blocks any other operation on the content.
async function requestDeletion(websiteId, contentId, userId, note) {
    const content = await CmsContent.findOne({ where: { id: contentId, websiteId } });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);

    await content.update({
        deletionRequestedBy: userId,
        deletionRequestedAt: new Date(),
        deletionRequestNote: note || null,
    });
    await cache.del(cache.keys.content(contentId));
    return content.toJSON();
}

// Editor+/admin declines the request without deleting — clears the flag, content is untouched.
async function dismissDeletionRequest(websiteId, contentId) {
    const content = await CmsContent.findOne({ where: { id: contentId, websiteId } });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);

    await content.update({ deletionRequestedBy: null, deletionRequestedAt: null, deletionRequestNote: null });
    await cache.del(cache.keys.content(contentId));
    return content.toJSON();
}

async function listDeletionRequests(websiteId) {
    const rows = await CmsContent.findAll({
        where: { websiteId, deletionRequestedAt: { [Op.ne]: null } },
        order: [['deletionRequestedAt', 'DESC']],
        attributes: { exclude: ['contentBlocks'] },
    });
    return rows.map((r) => r.toJSON());
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

// Keeps CmsCategory.contentCount (shown in the admin taxonomy tree) in sync with actual
// content assignments. Mirrors _incrementTagUsage — same category tree cache key
// taxonomyService.listCategories() reads, so it must be busted on every change.
async function _incrementCategoryCount(websiteId, categoryIds, delta) {
    if (!categoryIds.length) return;
    await CmsCategory.increment('contentCount', { by: delta, where: { id: { [Op.in]: categoryIds }, websiteId } });
    await cache.del(cache.keys.categoryTree(websiteId));
}

// Merge an explicit categoryIds array with the legacy single categoryId into one
// deduped, order-preserving array (the first element is treated as the primary).
function _normalizeCategoryIds(categoryIds, categoryId) {
    const source = Array.isArray(categoryIds) ? categoryIds : [];
    const merged = categoryId ? [categoryId, ...source] : source;
    return [...new Set(merged.filter(Boolean))];
}

module.exports = {
    listContent, getContent, getPreviewToken, createContent, updateContent, autosaveContent, duplicateContent, deleteContent,
    bulkUpdate, incrementViewCount, requestDeletion, dismissDeletionRequest, listDeletionRequests,
};
