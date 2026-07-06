'use strict';
/**
 * Google News connector.
 *
 * Google does not publish a per-publisher "News metrics" API. The closest real
 * signal is Search Console's Search Analytics `type: 'news'` filter, which
 * isolates clicks/impressions/CTR/position for News-surface impressions on the
 * property GSC already covers. This connector reuses GSC-style OAuth
 * credentials + siteUrl — there is no separate News-specific API to call.
 *
 * requiredCreds: siteUrl, oauthClientId, oauthClientSecret, refreshToken
 */
const { accessTokenFrom, requireCreds } = require('./lib/googleAuth');

const API_BASE = 'https://www.googleapis.com/webmasters/v3/sites';
const ROW_LIMIT = 25;
const day = (d) => d.toISOString().slice(0, 10);

async function query(siteUrl, token, payload) {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Google News (GSC type=news) query failed: HTTP ${res.status}`);
    const json = await res.json();
    return json.rows || [];
}

function rowMetrics(row, dims, periodStart, periodEnd) {
    return [
        { metric: 'clicks', dims, value: row.clicks || 0, granularity: 'range', periodStart, periodEnd },
        { metric: 'impressions', dims, value: row.impressions || 0, granularity: 'range', periodStart, periodEnd },
        { metric: 'ctr', dims, value: Math.round((row.ctr || 0) * 10000) / 100, granularity: 'range', periodStart, periodEnd },
        { metric: 'position', dims, value: Math.round((row.position || 0) * 100) / 100, granularity: 'range', periodStart, periodEnd },
    ];
}

module.exports = {
    id: 'google-news',
    provider: 'google-news',
    category: 'seo',
    requiredCreds: ['siteUrl', 'oauthClientId', 'oauthClientSecret', 'refreshToken'],

    validate(creds) { requireCreds(creds, this.requiredCreds, 'Google News'); },

    async sync({ creds, since, until, logger }) {
        const merged = { ...(creds.config || {}), ...(creds.secrets || {}), ...creds };
        this.validate(merged);
        const siteUrl = merged.siteUrl;
        const startDate = day(since);
        const endDate = day(until);
        const token = await accessTokenFrom(merged);
        const base = { startDate, endDate, type: 'news' };

        const out = [];
        const totals = await query(siteUrl, token, { ...base, rowLimit: 1 });
        if (totals[0]) out.push(...rowMetrics(totals[0], {}, startDate, endDate));

        const pages = await query(siteUrl, token, { ...base, dimensions: ['page'], rowLimit: ROW_LIMIT });
        for (const r of pages) out.push(...rowMetrics(r, { page: (r.keys && r.keys[0]) || '(unknown)' }, startDate, endDate));

        logger.debug({ pages: pages.length }, 'Google News (GSC news filter) sync complete');
        return out;
    },
};
