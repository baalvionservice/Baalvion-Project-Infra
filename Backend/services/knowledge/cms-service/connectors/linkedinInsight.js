'use strict';
/**
 * LinkedIn Insight connector (Marketing API — Ad Analytics).
 *
 * Like Meta, LinkedIn Insight Tag firings are not individually queryable via a
 * public API — the supported read path is the sponsored ad account's Ad
 * Analytics (impressions/clicks/spend/conversions for campaigns driving traffic
 * to the tagged site).
 *
 * requiredCreds: adAccountId (sponsoredAccount numeric id), accessToken
 */
const { requireCreds } = require('./lib/googleAuth');

const API_BASE = 'https://api.linkedin.com/rest/adAnalytics';
const day = (d) => d.toISOString().slice(0, 10);
const dateParam = (d) => `(year:${d.getUTCFullYear()},month:${d.getUTCMonth() + 1},day:${d.getUTCDate()})`;

module.exports = {
    id: 'linkedin-insight',
    provider: 'linkedin-insight',
    category: 'marketing',
    requiredCreds: ['adAccountId', 'accessToken'],

    validate(creds) { requireCreds(creds, this.requiredCreds, 'LinkedIn'); },

    async sync({ creds, since, until, logger }) {
        const merged = { ...(creds.config || {}), ...(creds.secrets || {}), ...creds };
        this.validate(merged);
        const account = `urn:li:sponsoredAccount:${merged.adAccountId}`;

        const params = new URLSearchParams();
        params.set('q', 'analytics');
        params.set('pivot', 'ACCOUNT');
        params.set('dateRange.start', dateParam(since));
        params.set('dateRange.end', dateParam(until));
        params.set('accounts[0]', account);
        params.set('fields', 'impressions,clicks,costInLocalCurrency,externalWebsiteConversions');

        const res = await fetch(`${API_BASE}?${params.toString()}`, {
            headers: { Authorization: `Bearer ${merged.accessToken}`, 'LinkedIn-Version': '202401', 'X-Restli-Protocol-Version': '2.0.0' },
        });
        if (!res.ok) throw new Error(`LinkedIn Ad Analytics failed: HTTP ${res.status}`);
        const json = await res.json();
        const row = (json.elements && json.elements[0]) || {};

        const startDate = day(since);
        const endDate = day(until);
        const out = [
            { metric: 'impressions', dims: {}, value: Number(row.impressions || 0), granularity: 'range', periodStart: startDate, periodEnd: endDate },
            { metric: 'clicks', dims: {}, value: Number(row.clicks || 0), granularity: 'range', periodStart: startDate, periodEnd: endDate },
            { metric: 'spend', dims: {}, value: Number(row.costInLocalCurrency || 0), granularity: 'range', periodStart: startDate, periodEnd: endDate },
            { metric: 'conversions', dims: {}, value: Number(row.externalWebsiteConversions || 0), granularity: 'range', periodStart: startDate, periodEnd: endDate },
        ];
        logger.debug({ hasData: !!(json.elements && json.elements.length) }, 'LinkedIn sync complete');
        return out;
    },
};
