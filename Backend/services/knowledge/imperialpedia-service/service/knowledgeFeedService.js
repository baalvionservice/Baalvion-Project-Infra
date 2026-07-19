'use strict';
const config = require('../config/appConfig');

const CMS_WEBSITE_SLUG = process.env.CMS_KNOWLEDGE_WEBSITE_SLUG || 'imperialpedia';

// The unified data layer for the "Global Data Package" bulk API prototype — normalizes
// imperialpedia-service's own `articles` and cms-service's `cms_contents` (fetched via its
// internal bulk feed, see cms-service's service/contentFeedService.js) into one common shape.
// Adding a third knowledge source later means adding one normalizer function here, not a new
// endpoint per source — that's the actual point of "unified": one shape, one feed, N sources.

function normalizeArticle(a) {
    return {
        source: 'article',
        sourceId: String(a.id),
        title: a.title,
        slug: a.slug,
        summary: a.summary || null,
        bodyFormat: 'text',
        body: a.content || null,
        isPremium: Boolean(a.is_premium),
        category: a.category || null,
        tags: a.tags || [],
        publishedAt: a.published_at,
        url: `/articles/${a.slug}`,
    };
}

// cms_contents' content is block-structured (contentBlocks), not plain text — passed through
// as-is (bodyFormat: 'blocks') rather than lossily flattened to a string, so a data-package
// consumer that wants the real structure still gets it.
function normalizeCmsContent(c) {
    return {
        source: 'cms_content',
        sourceId: String(c.id),
        title: c.title,
        slug: c.slug,
        summary: c.excerpt || null,
        bodyFormat: 'blocks',
        body: c.contentBlocks || null,
        isPremium: Boolean(c.isPremium),
        category: (c.category && c.category.name) || null,
        tags: [],
        publishedAt: c.publishedAt,
        url: `/${c.slug}`,
    };
}

async function fetchArticlesPage({ limit, offset }) {
    const db = require('../models');
    const { rows, count } = await db.Article.findAndCountAll({
        where: { status: 'published' },
        order: [['published_at', 'DESC']],
        limit, offset,
    });
    return { items: rows.map((r) => normalizeArticle(r.toJSON())), total: count };
}

async function fetchCmsContentPage({ limit, offset }) {
    const url = `${config.cms.baseUrl}/internal/content-feed/${encodeURIComponent(CMS_WEBSITE_SLUG)}?limit=${limit}&offset=${offset}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const res = await fetch(url, { headers: { 'x-internal-secret': config.internalSecret }, signal: controller.signal });
        if (!res.ok) throw new Error(`cms-service content-feed responded ${res.status}`);
        const body = await res.json();
        const items = (body.data && body.data.items) || [];
        return { items: items.map(normalizeCmsContent), total: (body.data && body.data.total) || 0 };
    } finally {
        clearTimeout(timeout);
    }
}

// Merges both sources by publishedAt DESC into one page. Each source is queried independently
// for up to `limit` rows, then the merge is trimmed to `limit` — NOT a true cross-source cursor
// (that needs a merged materialized index, e.g. a denormalized "knowledge_items" table kept in
// sync by both services' publish events — a real follow-up, not a prototype-scope problem). For
// now, a caller paging deep with `offset` may see minor drift between sources; acceptable for a
// bulk/batch consumer, not for a UI needing stable pagination.
async function buildKnowledgeFeed({ limit = 20, offset = 0 } = {}) {
    const boundedLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const boundedOffset = Math.max(0, Number(offset) || 0);

    const [articles, cmsContent] = await Promise.all([
        fetchArticlesPage({ limit: boundedLimit, offset: boundedOffset }),
        fetchCmsContentPage({ limit: boundedLimit, offset: boundedOffset }),
    ]);

    const merged = [...articles.items, ...cmsContent.items]
        .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
        .slice(0, boundedLimit);

    return {
        items: merged,
        sources: {
            article: { returned: articles.items.length, total: articles.total },
            cms_content: { returned: cmsContent.items.length, total: cmsContent.total },
        },
        limit: boundedLimit,
        offset: boundedOffset,
    };
}

module.exports = { buildKnowledgeFeed, normalizeArticle, normalizeCmsContent };
