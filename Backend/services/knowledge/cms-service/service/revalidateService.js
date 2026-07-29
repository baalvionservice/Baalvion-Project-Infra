'use strict';
const config = require('../config/appConfig');
const { logger } = require('../platform/logger');
const { CmsCategory } = require('../models');

/**
 * On-publish revalidation dispatcher.
 *
 * When content is published, unpublished, or edited live, the public delivery
 * cache is already busted (so dynamic / no-store frontends reflect the change on
 * the next request). For frontends that build-cache pages (Next.js ISR — e.g.
 * Imperialpedia's topic pages), we additionally POST the site's revalidate
 * webhook so those pages refresh immediately.
 *
 * Configured via `config.revalidate` (REVALIDATE_SECRET + REVALIDATE_WEBHOOKS).
 * Fire-and-forget and fail-open: a missing or failing webhook must never affect
 * the publish path or add latency to the transition response.
 */
function urlFor(websiteSlug) {
    const map = (config.revalidate && config.revalidate.webhooks) || {};
    return (websiteSlug && map[websiteSlug]) || null;
}

// Same fixed region-id set Imperialpedia's worldRegions.ts uses for its
// `/world/<region>` market pages ("world" itself excluded — it's the tree root,
// not a region). A checked category matching one of these ids is the region;
// whichever OTHER checked category has that region as its parent is the
// country; one level deeper again is the state/province. Mirrors
// cms-public.ts's deriveWorldGeo on the frontend exactly, so the path computed
// here always matches the one Next.js actually renders the article at.
const WORLD_REGION_IDS = new Set(['us', 'europe', 'asia', 'china', 'emerging']);

function _publishedDateParts(content) {
    const parsed = content && content.publishedAt ? new Date(content.publishedAt) : new Date();
    const safe = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    return {
        yyyy: String(safe.getUTCFullYear()),
        mm: String(safe.getUTCMonth() + 1).padStart(2, '0'),
        dd: String(safe.getUTCDate()).padStart(2, '0'),
    };
}

// The article's own real canonical page — NOT the bare `/<slug>`, which is a
// different cached route (a redirect stub) for both guides and news. Without
// this, revalidatePath() only ever busts a page nobody actually lands on, and
// the real dated/`/world/...`-nested article page stays stale until its own
// 300s fetch-revalidate safety net happens to expire on someone's next visit.
function _canonicalContentPath(content, checkedCategories) {
    const slug = content && content.slug;
    if (!slug) return null;

    // Content-engine guides live at /<categorySlug>/<slug> (or the legacy
    // /financial-intelligence/<slug> bucket when uncategorized).
    if (content.contentType === 'article') {
        const primary = checkedCategories.find((c) => c.id === content.categoryId);
        return primary && primary.slug ? `/${primary.slug}/${slug}` : `/financial-intelligence/${slug}`;
    }

    // News: a World > Region > Country (> State) branch among the CHECKED
    // categories (editors check both the region and the country, not just the
    // leaf — see deriveWorldGeo) means the nested /world/... permalink;
    // otherwise it's the flat dated URL.
    const regionCat = checkedCategories.find((c) => WORLD_REGION_IDS.has(c.slug));
    const { yyyy, mm, dd } = _publishedDateParts(content);
    if (regionCat) {
        const countryCat = checkedCategories.find((c) => c.parentId === regionCat.id);
        if (countryCat) {
            const stateCat = checkedCategories.find((c) => c.parentId === countryCat.id);
            const statePart = stateCat ? `/${stateCat.slug}` : '';
            return `/world/${regionCat.slug}/${countryCat.slug}${statePart}/${yyyy}/${mm}/${dd}/${slug}`;
        }
    }
    return `/${yyyy}/${mm}/${dd}/${slug}`;
}

// Best-effort canonical paths/urls for a single content item. The frontend route
// unions these with its own default hub paths (home, listing pages, sitemap).
//
// Also busts the category/pillar hub page(s) this item is filed under (e.g.
// Imperialpedia's /savings lists every article tagged with the "savings"
// category) — without this, an edit appears at the article's own path
// immediately but the hub page listing it stays stale until its own ISR TTL
// expires, since nothing else ever revalidates it early.
async function pathsForContent(content, domain) {
    const slug = content && content.slug;
    const paths = ['/'];

    const categoryIds = [
        ...(content && content.categoryId ? [content.categoryId] : []),
        ...(content && Array.isArray(content.categoryIds) ? content.categoryIds : []),
    ];
    let categories = [];
    if (categoryIds.length) {
        try {
            categories = await CmsCategory.findAll({
                where: { id: [...new Set(categoryIds)] },
                attributes: ['id', 'slug', 'parentId'],
            });
            for (const cat of categories) {
                if (cat.slug) paths.push(`/${cat.slug}`);
            }
        } catch { /* fail-open — category lookup must never block revalidation */ }
    }

    const canonicalPath = _canonicalContentPath(content, categories);
    if (canonicalPath) paths.push(canonicalPath);
    else if (slug) paths.push(`/${slug}`);

    const urls = [];
    if (domain && slug) {
        const host = String(domain).replace(/^https?:\/\//, '').replace(/\/+$/, '');
        if (host) urls.push(`https://${host}${canonicalPath || `/${slug}`}`);
    }
    return { paths: [...new Set(paths)], urls };
}

function dispatch(websiteSlug, { paths = [], urls = [] } = {}) {
    const endpoint = urlFor(websiteSlug);
    const secret = config.revalidate && config.revalidate.secret;
    if (!endpoint || !secret) return; // not configured for this site → no-op

    const timeoutMs = (config.revalidate && config.revalidate.timeoutMs) || 5000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Detached promise — never awaited by callers.
    fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
        body: JSON.stringify({ paths, urls }),
        signal: controller.signal,
    })
        .then((res) => {
            if (!res.ok) {
                try { logger('revalidate').warn({ websiteSlug, status: res.status }, 'revalidate webhook returned non-2xx'); } catch { /* logging must never throw */ }
            }
        })
        .catch((err) => {
            try { logger('revalidate').warn({ websiteSlug, err: err && err.message }, 'revalidate webhook failed'); } catch { /* logging must never throw */ }
        })
        .finally(() => clearTimeout(timer));
}

module.exports = { dispatch, pathsForContent };
