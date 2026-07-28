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
    if (slug) paths.push(`/${slug}`);

    const categoryIds = [
        ...(content && content.categoryId ? [content.categoryId] : []),
        ...(content && Array.isArray(content.categoryIds) ? content.categoryIds : []),
    ];
    if (categoryIds.length) {
        try {
            const categories = await CmsCategory.findAll({
                where: { id: [...new Set(categoryIds)] },
                attributes: ['slug'],
            });
            for (const cat of categories) {
                if (cat.slug) paths.push(`/${cat.slug}`);
            }
        } catch { /* fail-open — category lookup must never block revalidation */ }
    }

    const urls = [];
    if (domain && slug) {
        const host = String(domain).replace(/^https?:\/\//, '').replace(/\/+$/, '');
        if (host) urls.push(`https://${host}/${slug}`);
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
