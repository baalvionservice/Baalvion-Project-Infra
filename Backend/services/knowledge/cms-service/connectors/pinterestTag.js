'use strict';
/**
 * Pinterest Tag connector (Ads API — Analytics).
 *
 * Same platform reality as Meta/LinkedIn: real read access is ad-account
 * analytics, not raw tag fire counts.
 *
 * requiredCreds: adAccountId, accessToken
 */
const { requireCreds } = require('./lib/googleAuth');

const API_BASE = 'https://api.pinterest.com/v5';
const day = (d) => d.toISOString().slice(0, 10);

module.exports = {
    id: 'pinterest-tag',
    provider: 'pinterest-tag',
    category: 'marketing',
    requiredCreds: ['adAccountId', 'accessToken'],

    validate(creds) { requireCreds(creds, this.requiredCreds, 'Pinterest'); },

    async sync({ creds, since, until, logger }) {
        const merged = { ...(creds.config || {}), ...(creds.secrets || {}), ...creds };
        this.validate(merged);
        const startDate = day(since);
        const endDate = day(until);

        const params = new URLSearchParams({
            start_date: startDate, end_date: endDate,
            columns: 'SPEND_IN_DOLLAR,IMPRESSION_2,CLICKTHROUGH_2',
            granularity: 'TOTAL',
        });
        const res = await fetch(`${API_BASE}/ad_accounts/${merged.adAccountId}/analytics?${params.toString()}`, {
            headers: { Authorization: `Bearer ${merged.accessToken}` },
        });
        if (!res.ok) throw new Error(`Pinterest Analytics failed: HTTP ${res.status}`);
        const json = await res.json();
        const row = Array.isArray(json) ? (json[0] || {}) : (json.data || json || {});

        const out = [
            { metric: 'spend', dims: {}, value: Number(row.SPEND_IN_DOLLAR || 0), granularity: 'range', periodStart: startDate, periodEnd: endDate },
            { metric: 'impressions', dims: {}, value: Number(row.IMPRESSION_2 || 0), granularity: 'range', periodStart: startDate, periodEnd: endDate },
            { metric: 'clicks', dims: {}, value: Number(row.CLICKTHROUGH_2 || 0), granularity: 'range', periodStart: startDate, periodEnd: endDate },
        ];
        logger.debug({ ok: res.ok }, 'Pinterest sync complete');
        return out;
    },
};
