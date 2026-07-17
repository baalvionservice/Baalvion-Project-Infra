'use strict';

// Imports real wire articles from news-service (the platform's dedicated wire-
// ingestion service — BBC, TechCrunch, MarketWatch, etc., see
// Backend/services/knowledge/news-service/scripts/seedSources.js) into this
// website's CMS as draft news items, so editors can review/publish them from
// the same admin News Desk instead of them only existing as ephemeral
// wire-topup content on the public site. Every field written here comes from
// the real news-service record (title, summary, image, source, url) — nothing
// fabricated. Imported as DRAFTS, never auto-published: republishing wire
// content under Imperialpedia's byline is an editorial decision, not this
// pipeline's to make.

const { randomUUID } = require('crypto');
const { CmsContent, CmsCategory, CmsWorkflow, sequelize } = require('../models');
const { slugify } = require('../utils/slugify');

const NEWS_SERVICE_URL = process.env.NEWS_SERVICE_URL || 'http://localhost:3045';
// Shared platform secret — already configured on every consolidated-backend
// service that talks internally (commerce/identity/infrastructure/etc; see
// news-service/middleware/internalAuth.js). Not a new secret to provision.
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

// news-service's own category enum → Imperialpedia's 13-topic taxonomy.
const WIRE_CATEGORY_TO_TOPIC = {
    AI: 'Tech', Technology: 'Tech', Cybersecurity: 'Tech',
    Business: 'Business', Startups: 'Business',
    Finance: 'Finance', World: 'World', Science: 'Health & Science',
};

// news-service's `country` → Imperialpedia's 6 regions. news-service's own seed
// data (scripts/seedSources.js) stores 'UK' (not the ISO 3166-1 'GB') for BBC —
// both map here so real seeded sources classify correctly.
const COUNTRY_TO_REGION = {
    US: { label: 'U.S.', slug: 'us' },
    GB: { label: 'Europe', slug: 'europe' }, UK: { label: 'Europe', slug: 'europe' },
    DE: { label: 'Europe', slug: 'europe' },
    FR: { label: 'Europe', slug: 'europe' }, ES: { label: 'Europe', slug: 'europe' },
    IT: { label: 'Europe', slug: 'europe' }, NL: { label: 'Europe', slug: 'europe' },
    CN: { label: 'China', slug: 'china' }, HK: { label: 'China', slug: 'china' },
    JP: { label: 'Asia-Pacific', slug: 'asia' }, KR: { label: 'Asia-Pacific', slug: 'asia' },
    IN: { label: 'Asia-Pacific', slug: 'asia' }, AU: { label: 'Asia-Pacific', slug: 'asia' },
    SG: { label: 'Asia-Pacific', slug: 'asia' },
    BR: { label: 'Emerging Markets', slug: 'emerging' }, ZA: { label: 'Emerging Markets', slug: 'emerging' },
    MX: { label: 'Emerging Markets', slug: 'emerging' }, RU: { label: 'Emerging Markets', slug: 'emerging' },
    ID: { label: 'Emerging Markets', slug: 'emerging' },
};
const WORLD_REGION = { label: 'World', slug: 'world' };

// Returns { articles, error } instead of throwing/swallowing — the controller
// surfaces `error` back to the (already role-gated) admin caller so a
// misconfigured NEWS_SERVICE_URL/INTERNAL_API_KEY is diagnosable from the
// button click itself, not just silently "0 imported".
async function fetchWireArticles(limit) {
    if (!INTERNAL_API_KEY) return { articles: [], error: 'INTERNAL_API_KEY not set on cms-service' };
    try {
        const res = await fetch(`${NEWS_SERVICE_URL}/internal/v1/news?limit=${limit}`, {
            headers: { 'X-Internal-Key': INTERNAL_API_KEY },
        });
        if (!res.ok) {
            const body = await res.text().catch(() => '');
            return { articles: [], error: `news-service responded ${res.status}: ${body.slice(0, 200)}` };
        }
        const env = await res.json();
        // news-service's listArticles responds via sendPaginated: { data: { items, page,
        // limit, total, totalPages } } — the array is data.items, not data itself.
        const items = env.data?.items;
        return { articles: Array.isArray(items) ? items : [], error: null };
    } catch (err) {
        return { articles: [], error: `could not reach ${NEWS_SERVICE_URL}: ${err.message}` };
    }
}

async function resolveOrCreateCategory(websiteId, name, slug) {
    const existing = await CmsCategory.findOne({ where: { websiteId, slug } });
    if (existing) return existing.id;
    const created = await CmsCategory.create({
        websiteId, name, slug, parentId: null, sortOrder: 0, depth: 0, status: 'active', contentCount: 0,
    });
    return created.id;
}

async function uniqueSlug(websiteId, base) {
    const clean = (base && String(base).trim()) || 'wire-story';
    let candidate = clean;
    for (let n = 2; n <= 1000; n++) {
        const existing = await CmsContent.findOne({ where: { websiteId, slug: candidate } });
        if (!existing) return candidate;
        candidate = `${clean}-${n}`;
    }
    return `${clean}-${Date.now()}`;
}

async function importWireNews(websiteId, userId, limit = 50) {
    if (!INTERNAL_API_KEY) {
        return { imported: 0, skipped: 0, total: 0, configured: false, error: 'INTERNAL_API_KEY not set on cms-service' };
    }

    const { articles, error } = await fetchWireArticles(limit);
    if (!articles.length) return { imported: 0, skipped: 0, total: 0, configured: true, error };

    // Resolve/create the 13 topic + 6 region categories once, on demand, as
    // each is first needed (small in-memory cache for this run).
    const categoryIdCache = new Map();
    const resolveCached = async (name, slug) => {
        const key = `${name}:${slug}`;
        if (!categoryIdCache.has(key)) categoryIdCache.set(key, await resolveOrCreateCategory(websiteId, name, slug));
        return categoryIdCache.get(key);
    };

    let imported = 0;
    let skipped = 0;

    for (const a of articles) {
        if (!a.title || !a.url) { skipped += 1; continue; }

        const existing = await CmsContent.findOne({ where: { websiteId, externalSourceUrl: a.url } });
        if (existing) { skipped += 1; continue; }

        const topicName = WIRE_CATEGORY_TO_TOPIC[a.category] || 'World';
        const region = (a.country && COUNTRY_TO_REGION[String(a.country).toUpperCase()]) || WORLD_REGION;

        const topicId = await resolveCached(topicName, slugify(topicName));
        const regionId = await resolveCached(region.label, region.slug);

        const summary = (a.summary_ai || a.summary_raw || '').trim();
        const slug = await uniqueSlug(websiteId, slugify(a.title));

        await sequelize.transaction(async (t) => {
            const c = await CmsContent.create({
                websiteId, categoryId: topicId, categoryIds: [topicId, regionId],
                authorId: userId, lastEditedBy: userId,
                title: a.title, slug,
                excerpt: summary ? summary.slice(0, 500) : null,
                featuredImage: a.image_url || null,
                contentType: 'news',
                // The wire summary is real data (news-service's own ingestion output),
                // not fabricated — surfaced as a starting paragraph, not a full article.
                // An editor still writes/expands the real body before publishing.
                contentBlocks: summary
                    ? [{ id: randomUUID(), type: 'paragraph', order: 0, content: { text: summary } }]
                    : [],
                tagIds: [], seoMetadata: {}, visibility: 'public',
                status: 'draft', revisionCount: 0, viewCount: 0,
                externalSourceName: a.source?.name || null,
                externalSourceUrl: a.url,
            }, { transaction: t });
            await CmsWorkflow.create({ contentId: c.id, currentState: 'draft', submittedBy: userId }, { transaction: t });
        });

        imported += 1;
    }

    return { imported, skipped, total: articles.length, configured: true };
}

module.exports = { importWireNews };
