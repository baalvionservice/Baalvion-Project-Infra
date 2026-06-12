'use strict';
/**
 * SEO indexing trigger — notifies search engines immediately after a publish so
 * newly live content gets crawled fast. Runs for BOTH manual publishes and
 * scheduler auto-publishes (both call this).
 *
 * Mechanism: IndexNow (Bing, Yandex, Seznam, Naver) — a single POST that asks the
 * engines to (re)crawl changed URLs. Google retired its sitemap ping endpoint in
 * 2023; for Google we rely on the dynamic sitemap (accurate <lastmod>) plus the
 * Search Console API (separate credentials, optional).
 *
 * Fully fail-open + env-gated:
 *   - Needs INDEXNOW_KEY (and the matching key file hosted at https://<host>/<key>.txt).
 *   - No key, no website domain, or a network error → no-op (never blocks publish).
 */
const { logger } = require('../platform/logger');
const log = logger('seo-ping');

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

/**
 * @param {object} args
 * @param {string} args.host   public host of the site, e.g. "ir.baalvion.com"
 * @param {string[]} args.urls absolute URLs that changed (homepage is a sane default)
 */
async function pingSearchEngines({ host, urls }) {
    const key = process.env.INDEXNOW_KEY;
    if (!key) { log.debug('INDEXNOW_KEY not set — skipping search-engine ping'); return { skipped: 'no-key' }; }
    if (!host) { log.debug('no site host — skipping search-engine ping'); return { skipped: 'no-host' }; }
    const list = (urls || []).filter(Boolean).slice(0, 10000);
    if (!list.length) return { skipped: 'no-urls' };

    try {
        const res = await fetch(INDEXNOW_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                host,
                key,
                keyLocation: `https://${host}/${key}.txt`,
                urlList: list,
            }),
        });
        log.info({ host, count: list.length, status: res.status }, 'submitted URLs to IndexNow');
        return { ok: res.ok, status: res.status };
    } catch (e) {
        log.warn({ host, err: e && e.message }, 'IndexNow ping failed (non-fatal)');
        return { ok: false, error: e && e.message };
    }
}

/**
 * Fire-and-forget convenience used by the publish paths. Resolves the host from the
 * website's `domain` column and always submits at least the homepage so the engine
 * re-crawls (the fresh sitemap carries the precise per-URL lastmod).
 */
function pingForWebsite(website, extraUrls = []) {
    try {
        const host = website && website.domain ? String(website.domain).replace(/^https?:\/\//, '').replace(/\/$/, '') : null;
        if (!host) return;
        const urls = [`https://${host}/`, `https://${host}/sitemap.xml`, ...extraUrls];
        void pingSearchEngines({ host, urls });
    } catch (e) {
        log.warn({ err: e && e.message }, 'pingForWebsite failed (non-fatal)');
    }
}

module.exports = { pingSearchEngines, pingForWebsite };
