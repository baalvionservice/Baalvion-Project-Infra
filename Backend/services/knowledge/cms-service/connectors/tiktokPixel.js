'use strict';
/**
 * TikTok Pixel connector (Business API — Integrated Reporting).
 *
 * TikTok's reporting API expects the access token in a custom `Access-Token`
 * header (not Authorization: Bearer) — a real quirk of their API, not a bug here.
 *
 * requiredCreds: advertiserId, accessToken
 */
const { requireCreds } = require('./lib/googleAuth');

const API_URL = 'https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/';
const day = (d) => d.toISOString().slice(0, 10);

module.exports = {
    id: 'tiktok-pixel',
    provider: 'tiktok-pixel',
    category: 'marketing',
    requiredCreds: ['advertiserId', 'accessToken'],

    validate(creds) { requireCreds(creds, this.requiredCreds, 'TikTok'); },

    async sync({ creds, since, until, logger }) {
        const merged = { ...(creds.config || {}), ...(creds.secrets || {}), ...creds };
        this.validate(merged);
        const startDate = day(since);
        const endDate = day(until);

        const params = new URLSearchParams({
            advertiser_id: merged.advertiserId,
            report_type: 'BASIC',
            data_level: 'AUCTION_ADVERTISER',
            dimensions: JSON.stringify(['advertiser_id']),
            metrics: JSON.stringify(['spend', 'impressions', 'clicks', 'conversion']),
            start_date: startDate,
            end_date: endDate,
        });
        const res = await fetch(`${API_URL}?${params.toString()}`, { headers: { 'Access-Token': merged.accessToken } });
        if (!res.ok) throw new Error(`TikTok reporting failed: HTTP ${res.status}`);
        const json = await res.json();
        if (json.code !== 0) throw new Error(`TikTok reporting error: ${json.message || json.code}`);
        const row = (json.data && json.data.list && json.data.list[0] && json.data.list[0].metrics) || {};

        const out = [
            { metric: 'spend', dims: {}, value: Number(row.spend || 0), granularity: 'range', periodStart: startDate, periodEnd: endDate },
            { metric: 'impressions', dims: {}, value: Number(row.impressions || 0), granularity: 'range', periodStart: startDate, periodEnd: endDate },
            { metric: 'clicks', dims: {}, value: Number(row.clicks || 0), granularity: 'range', periodStart: startDate, periodEnd: endDate },
            { metric: 'conversions', dims: {}, value: Number(row.conversion || 0), granularity: 'range', periodStart: startDate, periodEnd: endDate },
        ];
        logger.debug({ ok: json.code === 0 }, 'TikTok sync complete');
        return out;
    },
};
