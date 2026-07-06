'use strict';
/**
 * Google Merchant Center connector (Content API for Shopping v2.1, Reports service).
 *
 * requiredCreds: merchantId, oauthClientId, oauthClientSecret, refreshToken
 */
const { accessTokenFrom, requireCreds } = require('./lib/googleAuth');

const API_BASE = 'https://shoppingcontent.googleapis.com/content/v2.1';
const day = (d) => d.toISOString().slice(0, 10);

async function reportSearch(merchantId, token, query) {
    const res = await fetch(`${API_BASE}/${merchantId}/reports/search`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`Merchant Center reports:search failed: HTTP ${res.status}`);
    const json = await res.json();
    return json.results || [];
}

module.exports = {
    id: 'merchant-center',
    provider: 'merchant-center',
    category: 'ecommerce',
    requiredCreds: ['merchantId', 'oauthClientId', 'oauthClientSecret', 'refreshToken'],

    validate(creds) { requireCreds(creds, this.requiredCreds, 'Merchant Center'); },

    async sync({ creds, since, until, logger }) {
        const merged = { ...(creds.config || {}), ...(creds.secrets || {}), ...creds };
        this.validate(merged);
        const startDate = day(since);
        const endDate = day(until);
        const token = await accessTokenFrom(merged);

        const rows = await reportSearch(merged.merchantId, token, `
            SELECT segments.date, metrics.clicks, metrics.impressions, metrics.ctr
            FROM MerchantPerformanceView
            WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'`);

        const out = [];
        for (const r of rows) {
            const d = r.segments && r.segments.date;
            if (!d) continue;
            const m = r.metrics || {};
            out.push(
                { metric: 'clicks', dims: {}, value: Number(m.clicks || 0), granularity: 'day', periodStart: d, periodEnd: d },
                { metric: 'impressions', dims: {}, value: Number(m.impressions || 0), granularity: 'day', periodStart: d, periodEnd: d },
                { metric: 'ctr', dims: {}, value: Math.round(Number(m.ctr || 0) * 10000) / 100, granularity: 'day', periodStart: d, periodEnd: d },
            );
        }
        logger.debug({ days: rows.length }, 'Merchant Center sync fetched rows');
        return out;
    },
};
