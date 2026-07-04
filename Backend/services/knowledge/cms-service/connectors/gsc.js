'use strict';
/**
 * Google Search Console connector.
 *
 * Official Search Analytics API only (no scraping). Exchanges the stored OAuth
 * refresh token for a short-lived access token, then queries the property for the
 * sync window. Emits provider_metrics for the site total plus top queries and top
 * pages (clicks / impressions / ctr / position). Credentials live encrypted in the
 * CMS vault (provider `gsc`, category `analytics`); connect them in the console.
 *
 * requiredCreds: siteUrl, oauthClientId, oauthClientSecret, refreshToken
 *   siteUrl — the exact GSC property, e.g. "https://imperialpedia.baalvion.com/"
 *             or "sc-domain:baalvion.com"
 */
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API_BASE = 'https://www.googleapis.com/webmasters/v3/sites';
const ROW_LIMIT = 25;

const day = (d) => d.toISOString().slice(0, 10);

async function accessTokenFrom(creds) {
    const body = new URLSearchParams({
        client_id: creds.oauthClientId,
        client_secret: creds.oauthClientSecret,
        refresh_token: creds.refreshToken,
        grant_type: 'refresh_token',
    });
    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });
    if (!res.ok) throw new Error(`GSC token exchange failed: HTTP ${res.status}`);
    const json = await res.json();
    if (!json.access_token) throw new Error('GSC token exchange returned no access_token');
    return json.access_token;
}

async function query(siteUrl, token, payload) {
    const url = `${API_BASE}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`GSC searchAnalytics failed: HTTP ${res.status}`);
    const json = await res.json();
    return Array.isArray(json.rows) ? json.rows : [];
}

/** Turn one GSC row into the 4 metric records (clicks/impressions/ctr/position). */
function rowMetrics(row, dims, periodStart, periodEnd) {
    return [
        { metric: 'clicks', dims, value: row.clicks || 0, granularity: 'range', periodStart, periodEnd },
        { metric: 'impressions', dims, value: row.impressions || 0, granularity: 'range', periodStart, periodEnd },
        { metric: 'ctr', dims, value: Math.round((row.ctr || 0) * 10000) / 100, granularity: 'range', periodStart, periodEnd },
        { metric: 'position', dims, value: Math.round((row.position || 0) * 100) / 100, granularity: 'range', periodStart, periodEnd },
    ];
}

module.exports = {
    id: 'gsc',
    provider: 'gsc',
    category: 'seo',
    requiredCreds: ['siteUrl', 'oauthClientId', 'oauthClientSecret', 'refreshToken'],

    validate(creds) {
        for (const k of this.requiredCreds) {
            if (!creds || !creds[k]) throw new Error(`GSC connector missing credential: ${k}`);
        }
    },

    async sync({ creds, since, until, logger }) {
        const merged = { ...(creds.config || {}), ...(creds.secrets || {}), ...creds };
        this.validate(merged);
        const siteUrl = merged.siteUrl;
        const startDate = day(since);
        const endDate = day(until);

        const token = await accessTokenFrom(merged);
        const out = [];

        // Site total (no dimensions).
        const totalRows = await query(siteUrl, token, { startDate, endDate, rowLimit: 1 });
        if (totalRows[0]) out.push(...rowMetrics(totalRows[0], {}, startDate, endDate));

        // Top queries.
        const queries = await query(siteUrl, token, { startDate, endDate, dimensions: ['query'], rowLimit: ROW_LIMIT });
        for (const r of queries) out.push(...rowMetrics(r, { query: r.keys?.[0] || '(unknown)' }, startDate, endDate));

        // Top pages.
        const pages = await query(siteUrl, token, { startDate, endDate, dimensions: ['page'], rowLimit: ROW_LIMIT });
        for (const r of pages) out.push(...rowMetrics(r, { page: r.keys?.[0] || '(unknown)' }, startDate, endDate));

        logger.debug({ queries: queries.length, pages: pages.length }, 'GSC sync fetched rows');
        return out;
    },
};
