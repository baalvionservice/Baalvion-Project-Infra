'use strict';
/**
 * Meta Pixel connector (Marketing API — Ad Account Insights).
 *
 * There is no public API to read raw Meta Pixel fire counts for organic
 * traffic — Pixel data is only visible in Events Manager UI, or sent (not read)
 * via the Conversions API. The real, supported read path is Ad Account
 * Insights: impressions/clicks/spend for the campaigns driving traffic to the
 * pixel-tracked site. requiredCreds include the ad account, not just the pixel id.
 *
 * requiredCreds: adAccountId ("act_XXXXXXXXX" or bare numeric id), accessToken
 */
const { requireCreds } = require('./lib/googleAuth');

const API_BASE = 'https://graph.facebook.com/v19.0';
const day = (d) => d.toISOString().slice(0, 10);

function accountResource(id) {
    const s = String(id);
    return s.startsWith('act_') ? s : `act_${s}`;
}

module.exports = {
    id: 'meta-pixel',
    provider: 'meta-pixel',
    category: 'marketing',
    requiredCreds: ['adAccountId', 'accessToken'],

    validate(creds) { requireCreds(creds, this.requiredCreds, 'Meta'); },

    async sync({ creds, since, until, logger }) {
        const merged = { ...(creds.config || {}), ...(creds.secrets || {}), ...creds };
        this.validate(merged);
        const account = accountResource(merged.adAccountId);
        const startDate = day(since);
        const endDate = day(until);
        const timeRange = encodeURIComponent(JSON.stringify({ since: startDate, until: endDate }));

        const res = await fetch(
            `${API_BASE}/${account}/insights?fields=impressions,clicks,spend,ctr,cpc&time_range=${timeRange}&access_token=${encodeURIComponent(merged.accessToken)}`);
        if (!res.ok) throw new Error(`Meta Insights failed: HTTP ${res.status}`);
        const json = await res.json();
        const row = (json.data && json.data[0]) || {};

        const out = [
            { metric: 'impressions', dims: {}, value: Number(row.impressions || 0), granularity: 'range', periodStart: startDate, periodEnd: endDate },
            { metric: 'clicks', dims: {}, value: Number(row.clicks || 0), granularity: 'range', periodStart: startDate, periodEnd: endDate },
            { metric: 'spend', dims: {}, value: Number(row.spend || 0), granularity: 'range', periodStart: startDate, periodEnd: endDate },
            { metric: 'ctr', dims: {}, value: Number(row.ctr || 0), granularity: 'range', periodStart: startDate, periodEnd: endDate },
            { metric: 'cpc', dims: {}, value: Number(row.cpc || 0), granularity: 'range', periodStart: startDate, periodEnd: endDate },
        ];
        logger.debug({ hasData: !!(json.data && json.data.length) }, 'Meta sync complete');
        return out;
    },
};
