'use strict';
/**
 * SEO indexing trigger — notifies search engines immediately after a publish so
 * newly live content gets crawled fast. Runs for BOTH manual publishes and
 * scheduler auto-publishes (both call this).
 *
 * Two mechanisms, run in parallel, both fully fail-open + env-gated:
 *   - IndexNow (Bing, Yandex, Seznam, Naver) — a single POST asking the engines to
 *     (re)crawl changed URLs. Needs INDEXNOW_KEY (and the matching key file hosted
 *     at https://<host>/<key>.txt).
 *   - Google Indexing API — a service-account JWT-bearer exchange for an access
 *     token, then a per-URL POST asking Google to (re)crawl. Needs
 *     GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON (the raw service-account key JSON) and
 *     that service account added as an Owner on the property in Search Console.
 *
 * No key/credential, no website domain, or a network error → no-op per mechanism
 * (never blocks publish, never fails the other mechanism).
 */
const jwt = require('jsonwebtoken');
const { logger } = require('../platform/logger');
const log = logger('seo-ping');

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_INDEXING_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const GOOGLE_INDEXING_SCOPE = 'https://www.googleapis.com/auth/indexing';

// Cached in-process so a burst of publishes (e.g. bulk import) doesn't mint a new
// Google access token per URL — tokens are valid ~1hr, refreshed a bit early.
let cachedGoogleToken = null; // { accessToken, expiresAt }

function loadGoogleServiceAccount() {
    const raw = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON;
    if (!raw) return null;
    try {
        const creds = JSON.parse(raw);
        if (!creds.client_email || !creds.private_key) return null;
        return creds;
    } catch (e) {
        log.warn({ err: e && e.message }, 'GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON is not valid JSON — skipping Google Indexing API');
        return null;
    }
}

/** Exchanges the service-account key for a short-lived access token (RS256 JWT-bearer grant). */
async function getGoogleAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    if (cachedGoogleToken && cachedGoogleToken.expiresAt > now + 60) {
        return cachedGoogleToken.accessToken;
    }
    const creds = loadGoogleServiceAccount();
    if (!creds) return null;

    const assertion = jwt.sign(
        { scope: GOOGLE_INDEXING_SCOPE },
        creds.private_key,
        {
            algorithm: 'RS256',
            issuer: creds.client_email,
            audience: GOOGLE_TOKEN_ENDPOINT,
            expiresIn: '1h',
        },
    );

    const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion,
        }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Google token exchange failed (${res.status}): ${body.slice(0, 300)}`);
    }
    const json = await res.json();
    cachedGoogleToken = { accessToken: json.access_token, expiresAt: now + (json.expires_in || 3600) };
    return cachedGoogleToken.accessToken;
}

/**
 * Notifies the Google Indexing API for each URL. `type` is `URL_UPDATED` (new or
 * changed content — the common case) or `URL_DELETED` (unpublished/archived).
 *
 * Note: Google's published terms scope this API to JobPosting/BroadcastEvent
 * pages; submitting ordinary articles works technically (Google accepts the
 * request) but is outside that documented scope, so treat faster indexing here as
 * a best-effort signal on top of the sitemap, not a guarantee.
 */
async function notifyGoogleIndexing({ urls, type = 'URL_UPDATED' }) {
    const list = (urls || []).filter(Boolean);
    if (!list.length) return { skipped: 'no-urls' };

    let token;
    try {
        token = await getGoogleAccessToken();
    } catch (e) {
        log.warn({ err: e && e.message }, 'Google Indexing API token exchange failed (non-fatal)');
        return { ok: false, error: e && e.message };
    }
    if (!token) return { skipped: 'no-credentials' };

    const results = await Promise.allSettled(
        list.map((url) => fetch(GOOGLE_INDEXING_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ url, type }),
        })),
    );
    const failures = results.filter((r) => r.status === 'rejected' || (r.value && !r.value.ok));
    if (failures.length) {
        log.warn({ count: failures.length, total: list.length, type }, 'some Google Indexing API submissions failed (non-fatal)');
    } else {
        log.info({ count: list.length, type }, 'submitted URLs to Google Indexing API');
    }
    return { ok: failures.length === 0, submitted: list.length, failed: failures.length };
}

/**
 * @param {object} args
 * @param {string} args.host   public host of the site, e.g. "ir.baalvion.com"
 * @param {string[]} args.urls absolute URLs that changed (homepage is a sane default)
 * @param {'URL_UPDATED'|'URL_DELETED'} [args.googleType] Google Indexing API notification type
 */
async function pingSearchEngines({ host, urls, googleType = 'URL_UPDATED' }) {
    const list = (urls || []).filter(Boolean).slice(0, 10000);
    if (!host) { log.debug('no site host — skipping search-engine ping'); return { skipped: 'no-host' }; }
    if (!list.length) return { skipped: 'no-urls' };

    // IndexNow gets everything including sitemap.xml (harmless — it's just a recrawl
    // hint). Google's per-URL Indexing API should only ever see real content URLs.
    const contentUrls = list.filter((u) => !u.endsWith('/sitemap.xml'));

    const [indexNowResult, googleResult] = await Promise.allSettled([
        (async () => {
            const key = process.env.INDEXNOW_KEY;
            if (!key) { log.debug('INDEXNOW_KEY not set — skipping IndexNow'); return { skipped: 'no-key' }; }
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
        })(),
        notifyGoogleIndexing({ urls: contentUrls, type: googleType }),
    ]);

    return {
        indexNow: indexNowResult.status === 'fulfilled' ? indexNowResult.value : { ok: false, error: indexNowResult.reason && indexNowResult.reason.message },
        google: googleResult.status === 'fulfilled' ? googleResult.value : { ok: false, error: googleResult.reason && googleResult.reason.message },
    };
}

/**
 * Fire-and-forget convenience used by the publish paths. Resolves the host from the
 * website's `domain` column and always submits at least the homepage so the engines
 * re-crawl (the fresh sitemap carries the precise per-URL lastmod).
 */
function pingForWebsite(website, extraUrls = []) {
    try {
        const host = website && website.domain ? String(website.domain).replace(/^https?:\/\//, '').replace(/\/$/, '') : null;
        if (!host) return;
        const urls = [`https://${host}/`, `https://${host}/sitemap.xml`, ...extraUrls];
        void pingSearchEngines({ host, urls, googleType: 'URL_UPDATED' });
    } catch (e) {
        log.warn({ err: e && e.message }, 'pingForWebsite failed (non-fatal)');
    }
}

/**
 * Fire-and-forget convenience for unpublish/archive: tells Google the URL is gone
 * (URL_DELETED) so it drops out of the index promptly instead of waiting for a
 * recrawl to discover the 404/noindex. IndexNow has no equivalent "delete" verb —
 * the engines simply notice the changed status on their next crawl.
 */
function pingRemovalForWebsite(website, extraUrls = []) {
    try {
        const host = website && website.domain ? String(website.domain).replace(/^https?:\/\//, '').replace(/\/$/, '') : null;
        if (!host || !extraUrls.length) return;
        void notifyGoogleIndexing({ urls: extraUrls, type: 'URL_DELETED' });
    } catch (e) {
        log.warn({ err: e && e.message }, 'pingRemovalForWebsite failed (non-fatal)');
    }
}

module.exports = { pingSearchEngines, pingForWebsite, pingRemovalForWebsite, notifyGoogleIndexing };
