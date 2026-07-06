'use strict';
/**
 * Bing Webmaster Tools connector (Bing Webmaster API, plain API key — no OAuth).
 *
 * requiredCreds: siteUrl, apiKey
 */
const { requireCreds } = require('./lib/googleAuth');

const API_BASE = 'https://ssl.bing.com/webmaster/api.svc/json';

async function call(method, siteUrl, apiKey) {
    const url = `${API_BASE}/${method}?siteUrl=${encodeURIComponent(siteUrl)}&apikey=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Bing Webmaster ${method} failed: HTTP ${res.status}`);
    return res.json();
}

/** Bing dates arrive as "/Date(1690000000000)/" — extract the epoch millis. */
function parseBingDate(raw) {
    const m = /\/Date\((\d+)\)\//.exec(raw || '');
    return m ? new Date(Number(m[1])).toISOString().slice(0, 10) : null;
}

module.exports = {
    id: 'bing-webmaster',
    provider: 'bing-webmaster',
    category: 'seo',
    requiredCreds: ['siteUrl', 'apiKey'],

    validate(creds) { requireCreds(creds, this.requiredCreds, 'Bing Webmaster'); },

    async sync({ creds, since, until, logger }) {
        const merged = { ...(creds.config || {}), ...(creds.secrets || {}), ...creds };
        this.validate(merged);
        const out = [];

        // Site-level daily clicks/impressions/avg position.
        const traffic = await call('GetRankAndTrafficStats', merged.siteUrl, merged.apiKey);
        for (const row of (traffic.d || [])) {
            const d = parseBingDate(row.Date);
            if (!d || new Date(d) < since || new Date(d) > until) continue;
            out.push(
                { metric: 'clicks', dims: {}, value: Number(row.Clicks || 0), granularity: 'day', periodStart: d, periodEnd: d },
                { metric: 'impressions', dims: {}, value: Number(row.Impressions || 0), granularity: 'day', periodStart: d, periodEnd: d },
                { metric: 'avgClickPosition', dims: {}, value: Number(row.AvgClickPosition || 0), granularity: 'day', periodStart: d, periodEnd: d },
            );
        }

        // Top queries — this Bing endpoint has no date filter (all-time snapshot).
        const queries = await call('GetQueryStats', merged.siteUrl, merged.apiKey);
        const today = until.toISOString().slice(0, 10);
        for (const row of (queries.d || []).slice(0, 25)) {
            const dims = { query: row.Query || '(unknown)' };
            out.push(
                { metric: 'clicks', dims, value: Number(row.Clicks || 0), granularity: 'snapshot', periodStart: today, periodEnd: today },
                { metric: 'impressions', dims, value: Number(row.Impressions || 0), granularity: 'snapshot', periodStart: today, periodEnd: today },
            );
        }
        logger.debug({ points: out.length }, 'Bing Webmaster sync complete');
        return out;
    },
};
