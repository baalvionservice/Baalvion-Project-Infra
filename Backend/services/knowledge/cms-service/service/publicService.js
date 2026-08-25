'use strict';
const { Op } = require('sequelize');
const { hmacSign, safeCompare } = require('@baalvion/crypto');
const { decideAccess } = require('@baalvion/entitlements');
const { CmsWebsite, CmsContent, CmsCategory, CmsTag, CmsAuthor, CmsContentEntityMention, CmsSeoRedirect } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const config = require('../config/appConfig');
const contentService = require('./contentService');
const contentEvents = require('./analytics/contentEvents');
const entitlementClient = require('./entitlementClient');
const { parsePagination, buildPaginated } = require('../utils/pagination');

// In-process cache, mirrors entitlementClient.js's _subscriptionCache — a site's config
// changes rarely, so every public read (content, category, authors, listings) paying for
// a DB round trip just to re-resolve the same website row was pure latency under load,
// stacking with the content query itself on every cache-miss request.
const WEBSITE_CACHE_TTL_MS = 60_000;
const _websiteCache = new Map(); // slug -> { at, website }

async function _resolveWebsite(websiteSlug) {
    const cached = _websiteCache.get(websiteSlug);
    if (cached && Date.now() - cached.at < WEBSITE_CACHE_TTL_MS) return cached.website;
    const website = await CmsWebsite.findOne({ where: { slug: websiteSlug, status: 'active' } });
    if (!website) throw new AppError('NOT_FOUND', 'Website not found', 404);
    _websiteCache.set(websiteSlug, { at: Date.now(), website });
    return website;
}

// `category` (the belongsTo association above) only ever resolves the single
// primary categoryId — an editor who checks several categories in the admin
// panel (e.g. a topic like "Politics" plus a World > Region > Country branch
// like "India") has that fuller picture stored in `categoryIds`, but it was
// never surfaced to readers. Frontends that need to tell "this is filed under
// Politics" apart from "this is filed under India" (see Imperialpedia's
// world/[region]/[country] route) need every checked category, with parentId
// so the tree shape (World > Asia-Pacific > India) can be walked client-side.
async function _resolveCategoryList(websiteId, categoryIds) {
    if (!Array.isArray(categoryIds) || !categoryIds.length) return [];
    const rows = await CmsCategory.findAll({
        where: { id: { [Op.in]: categoryIds }, websiteId },
        attributes: ['id', 'name', 'slug', 'parentId', 'imageUrl'],
    });
    return rows.map((r) => r.toJSON());
}

async function getPublicContent(websiteSlug, slug, { callerId } = {}) {
    const cacheKey = cache.keys.publicContent(websiteSlug, slug);
    const cached = await cache.get(cacheKey);

    let data;
    if (cached) {
        // Fire-and-forget (matches recordContentView + the redirect hit-count below) — a
        // view-count write has no bearing on what this request returns, so it must never
        // sit in front of the response. Previously awaited here, which meant every single
        // request — cache hit or not — paid for a DB write's full round trip before the
        // page could render.
        void contentService.incrementViewCount(cached.id).catch(() => {}); // best-effort counter, never surfaced
        void contentEvents.recordContentView(websiteSlug, cached); // fire-and-forget, fail-open
        data = cached;
    } else {
        const website = await _resolveWebsite(websiteSlug);
        const content = await CmsContent.findOne({
            where: { websiteId: website.id, slug, status: 'published', visibility: 'public' },
            include: [
                { model: CmsCategory, as: 'category', attributes: ['id', 'name', 'slug'], where: { status: 'active' }, required: false },
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
        if (!content) {
            // The slug may have been renamed (contentService.updateContent records a
            // redirect on every rename) — surface where it moved instead of a bare
            // 404, so callers can send the visitor/crawler on rather than losing them.
            const redirect = await CmsSeoRedirect.findOne({
                where: { websiteId: website.id, sourceUrl: slug, isActive: true },
                attributes: ['id', 'targetUrl'],
            });
            if (redirect) {
                void redirect.increment('hitCount'); // fire-and-forget, fail-open
                throw new AppError('CONTENT_MOVED', 'Content moved to a new URL', 404, { redirectTo: redirect.targetUrl });
            }
            throw new AppError('NOT_FOUND', 'Content not found', 404);
        }

        data = content.toJSON();
        data.categories = await _resolveCategoryList(website.id, data.categoryIds);
        await cache.set(cacheKey, data, config.cache.publicTtl);
        void contentService.incrementViewCount(content.id).catch(() => {}); // best-effort counter, see cache-hit branch above
        void contentEvents.recordContentView(websiteSlug, data); // fire-and-forget, fail-open
    }

    // Premium gate — resolved AFTER the cache read/write, every request, for every caller.
    // The cached row always holds the FULL content; redaction is a per-request overlay on top,
    // never baked into the cache itself (baking it in would leak paid content to whichever
    // caller happens to populate the cache first, or wrongly redact it for a payer).
    const access = await entitlementClient.resolveAccess({ userId: callerId, isPremiumContent: Boolean(data.isPremium) });
    if (access.isPremium && !access.hasAccess) {
        return { ...data, contentBlocks: null, access };
    }
    return { ...data, access };
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
    const data = content.toJSON();
    data.categories = await _resolveCategoryList(website.id, data.categoryIds);
    return data;
}

// Query-string booleans arrive as strings ("true"/"1") — only an explicit truthy
// value should filter; absence must mean "don't filter", not "require false".
function _isTruthyParam(v) {
    return v === 'true' || v === '1' || v === true;
}

// Fallback matching for listPublicContent's `search` param when the primary
// ILIKE `%search%` query (fast, index-friendly, handles the common case) comes
// back empty — a plain substring match never tolerates even one typo ("bods"
// doesn't contain "bonds"), and readers mistype far more often than the site
// has a matching pg_trgm/fuzzystrmatch extension installed to compensate for
// at the DB layer. Runs entirely in JS against a capped candidate set instead,
// so no schema/extension change is needed.
function _levenshtein(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
        const cur = [i];
        for (let j = 1; j <= n; j++) {
            cur[j] = a[i - 1] === b[j - 1]
                ? prev[j - 1]
                : 1 + Math.min(prev[j - 1], prev[j], cur[j - 1]);
        }
        prev = cur;
    }
    return prev[n];
}

// Typo budget scales with word length (same idea as Algolia/Elasticsearch's
// default) — 0 for very short words (too easy to false-positive on), 1 for
// typical words, 2 for long ones where a single extra typo is still obviously
// the same word.
function _typoBudget(len) {
    if (len <= 3) return 0;
    if (len <= 7) return 1;
    return 2;
}

const _WORD_RE = /[a-z0-9]+/g;
function _words(text) {
    return (text || '').toLowerCase().match(_WORD_RE) || [];
}

// True if every query word fuzzy-matches (prefix of, or within typo budget of)
// some word in the candidate text — AND across query words, so a two-word
// query still needs both represented, just not necessarily spelled exactly.
function _fuzzyMatch(queryWords, textWords) {
    return queryWords.every((qw) =>
        textWords.some((tw) => tw.startsWith(qw) || qw.startsWith(tw) || _levenshtein(qw, tw) <= _typoBudget(qw.length)),
    );
}

async function listPublicContent(websiteSlug, query = {}, { callerId } = {}) {
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

    const includes = [{ model: CmsCategory, as: 'category', attributes: ['id', 'name', 'slug'], where: { status: 'active' }, required: false }];

    if (categorySlug) {
        const cat = await CmsCategory.findOne({ where: { websiteId: website.id, slug: categorySlug, status: 'active' } });
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

    let { rows, count } = await CmsContent.findAndCountAll({
        where, include: includes,
        order,
        // Expose customFields so headless frontends can render list/card views
        // (status badges, layers, priorities, etc.). contentBlocks stays excluded
        // for list performance — fetch a single item for the full body.
        attributes: { exclude: ['contentBlocks'] },
        limit, offset,
    });

    // The exact ILIKE search above found nothing — try again tolerant of typos
    // (see _fuzzyMatch above) before reporting a genuine zero-result search.
    // Scoped to `search && count === 0` only: every other query keeps using
    // the fast, index-backed exact match above untouched.
    if (search && count === 0) {
        const queryWords = _words(search);
        if (queryWords.length) {
            const fallbackWhere = { ...where };
            delete fallbackWhere[Op.or];
            // Capped candidate set, not the whole table — this runs the fuzzy
            // comparison in JS, so it scans at most this many rows per search.
            const candidates = await CmsContent.findAll({
                where: fallbackWhere, include: includes, order,
                attributes: { exclude: ['contentBlocks'] },
                limit: 500,
            });
            // Tags are stored as tagIds (uuids) on content, not names, so a
            // "bnaking" (typo of "banking") search can't match a tag by text
            // without resolving names first — one lookup for every tag used
            // across the candidate set, not one query per row.
            const tagIdSet = new Set();
            candidates.forEach((row) => (row.tagIds || []).forEach((id) => tagIdSet.add(id)));
            const tagNameById = new Map();
            if (tagIdSet.size) {
                const tagRows = await CmsTag.findAll({
                    where: { id: { [Op.in]: [...tagIdSet] } },
                    attributes: ['id', 'name'],
                });
                tagRows.forEach((t) => tagNameById.set(t.id, t.name));
            }
            const matched = candidates.filter((row) => {
                const tagNames = (row.tagIds || []).map((id) => tagNameById.get(id) || '').join(' ');
                const haystack = `${row.title || ''} ${row.excerpt || ''} ${row.category?.name || ''} ${tagNames}`;
                return _fuzzyMatch(queryWords, _words(haystack));
            });
            rows = matched.slice(offset, offset + limit);
            count = matched.length;
        }
    }

    // contentBlocks is already excluded above, so there's no body to leak here — this is only
    // resolving `access` metadata for card-level paywall badges/CTAs. One subscription lookup
    // for the whole page (not per row) to avoid an N+1 call to imperialpedia-service; if that
    // lookup fails, `subscription` stays null, which decideAccess treats as free-tier (fails
    // closed to "no access" for premium items, same direction as the single-item gate — just
    // lower stakes here since no content body is at risk either way).
    const subscription = await entitlementClient.getSubscription(callerId).catch(() => null);
    const items = rows.map((row) => {
        const item = row.toJSON();
        const access = decideAccess({ isPremiumContent: Boolean(item.isPremium), subscription });
        return { ...item, access };
    });

    return buildPaginated(items, count, { page, limit });
}

async function getPublicCategory(websiteSlug, categorySlug) {
    const website = await _resolveWebsite(websiteSlug);
    const category = await CmsCategory.findOne({ where: { websiteId: website.id, slug: categorySlug, status: 'active' } });
    if (!category) throw new AppError('NOT_FOUND', 'Category not found', 404);
    return category.toJSON();
}

// Public author/contributor profiles for E-E-A-T bylines and /author pages.
const AUTHOR_ATTRS = ['id', 'slug', 'name', 'title', 'credentials', 'bio', 'avatarUrl', 'videoUrl', 'expertise', 'education', 'certifications', 'editorialRole', 'social', 'seoMetadata'];

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
