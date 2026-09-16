'use strict';

/**
 * Read-only client for news-service's first-party wire feed.
 *
 * The key is read as INTERNAL_API_KEY *or* INTERNAL_SERVICE_SECRET. Both names
 * are in use: news-service's gate calls it INTERNAL_API_KEY, while cms-service's
 * own environment sets INTERNAL_SERVICE_SECRET. wireImportService reads only the
 * first, which is why wire import reports "INTERNAL_API_KEY not set on
 * cms-service" in an environment that does in fact have the shared secret --
 * accepting either name here makes the pipeline work against the environment as
 * it is actually configured.
 */

const { logger } = require('../../platform/logger');

const NEWS_SERVICE_URL = process.env.NEWS_SERVICE_URL || 'http://localhost:3045';
const INTERNAL_KEY = process.env.INTERNAL_API_KEY || process.env.INTERNAL_SERVICE_SECRET || '';
// news-service caps `limit` at 100 per request.
const PAGE_SIZE = 100;

function isConfigured() {
    return Boolean(INTERNAL_KEY);
}

async function fetchPage({ page = 1, limit = PAGE_SIZE, category, from } = {}) {
    const q = new URLSearchParams({ page: String(page), limit: String(Math.min(limit, PAGE_SIZE)) });
    if (category) q.set('category', category);
    if (from) q.set('from', new Date(from).toISOString());

    const res = await fetch(`${NEWS_SERVICE_URL}/internal/v1/news?${q}`, {
        headers: { 'X-Internal-Key': INTERNAL_KEY },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`news-service responded ${res.status}: ${body.slice(0, 200)}`);
    }
    const env = await res.json();
    // listArticles responds through sendPaginated: { data: { items, page, limit, total, totalPages } }.
    const data = env.data || {};
    return { items: Array.isArray(data.items) ? data.items : [], totalPages: Number(data.totalPages) || 1 };
}

/**
 * Returns { articles, error }. Never throws: a wire outage should leave the
 * intake run reporting "0 new signals, news-service unreachable" rather than
 * failing the whole request.
 */
async function fetchWire({ limit = 200, category = null, sinceHours = 72 } = {}) {
    if (!isConfigured()) {
        return { articles: [], error: 'No internal key configured (set INTERNAL_API_KEY or INTERNAL_SERVICE_SECRET).' };
    }
    const from = new Date(Date.now() - sinceHours * 3600 * 1000);
    const out = [];
    try {
        for (let page = 1; out.length < limit; page += 1) {
            const { items, totalPages } = await fetchPage({ page, category, from });
            out.push(...items);
            if (!items.length || page >= totalPages) break;
        }
        return { articles: out.slice(0, limit), error: null };
    } catch (err) {
        logger('editorial').warn({ err: err.message }, 'wire fetch failed');
        // Partial results are still usable -- report them alongside the error.
        return { articles: out.slice(0, limit), error: `could not reach ${NEWS_SERVICE_URL}: ${err.message}` };
    }
}

module.exports = { fetchWire, isConfigured, NEWS_SERVICE_URL };
