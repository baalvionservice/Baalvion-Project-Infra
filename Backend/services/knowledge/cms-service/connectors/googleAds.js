'use strict';
/**
 * Google Ads connector (Google Ads API v17, REST + GAQL search).
 *
 * requiredCreds: customerId (10-digit, dashes optional), developerToken,
 *                oauthClientId, oauthClientSecret, refreshToken
 * Optional: loginCustomerId (manager/MCC account id, sent as login-customer-id
 *           when the OAuth user reaches the target account through a manager account).
 */
const { accessTokenFrom, requireCreds } = require('./lib/googleAuth');

const API_BASE = 'https://googleads.googleapis.com/v17';
const ROW_LIMIT = 25;
const day = (d) => d.toISOString().slice(0, 10);
const microsToUnits = (m) => Math.round((Number(m || 0) / 1_000_000) * 100) / 100;

async function gaqlSearch(customerId, token, developerToken, loginCustomerId, query) {
    const headers = { Authorization: `Bearer ${token}`, 'developer-token': developerToken, 'Content-Type': 'application/json' };
    if (loginCustomerId) headers['login-customer-id'] = String(loginCustomerId).replace(/-/g, '');
    const res = await fetch(`${API_BASE}/customers/${customerId}/googleAds:search`, {
        method: 'POST', headers, body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`Google Ads search failed: HTTP ${res.status}`);
    const json = await res.json();
    return json.results || [];
}

module.exports = {
    id: 'google-ads',
    provider: 'google-ads',
    category: 'marketing',
    requiredCreds: ['customerId', 'developerToken', 'oauthClientId', 'oauthClientSecret', 'refreshToken'],

    validate(creds) { requireCreds(creds, this.requiredCreds, 'Google Ads'); },

    async sync({ creds, since, until, logger }) {
        const merged = { ...(creds.config || {}), ...(creds.secrets || {}), ...creds };
        this.validate(merged);
        const customerId = String(merged.customerId).replace(/-/g, '');
        const startDate = day(since);
        const endDate = day(until);
        const token = await accessTokenFrom(merged);

        const rows = await gaqlSearch(customerId, token, merged.developerToken, merged.loginCustomerId, `
            SELECT campaign.name, metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.conversions
            FROM campaign
            WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
            ORDER BY metrics.clicks DESC
            LIMIT ${ROW_LIMIT}`);

        const out = [];
        const totals = { clicks: 0, impressions: 0, cost: 0, conversions: 0 };
        for (const r of rows) {
            const campaign = (r.campaign && r.campaign.name) || '(unknown)';
            const m = r.metrics || {};
            const clicks = Number(m.clicks || 0);
            const impressions = Number(m.impressions || 0);
            const cost = microsToUnits(m.costMicros);
            const conversions = Number(m.conversions || 0);
            totals.clicks += clicks; totals.impressions += impressions; totals.cost += cost; totals.conversions += conversions;

            const dims = { campaign };
            out.push(
                { metric: 'clicks', dims, value: clicks, granularity: 'range', periodStart: startDate, periodEnd: endDate },
                { metric: 'impressions', dims, value: impressions, granularity: 'range', periodStart: startDate, periodEnd: endDate },
                { metric: 'cost', dims, value: cost, granularity: 'range', periodStart: startDate, periodEnd: endDate },
                { metric: 'conversions', dims, value: conversions, granularity: 'range', periodStart: startDate, periodEnd: endDate },
            );
        }
        for (const [metric, value] of Object.entries(totals)) {
            out.push({ metric, dims: {}, value, granularity: 'range', periodStart: startDate, periodEnd: endDate });
        }
        logger.debug({ campaigns: rows.length }, 'Google Ads sync fetched rows');
        return out;
    },
};
