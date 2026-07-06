'use strict';
/**
 * Google Analytics 4 connector (Data API v1beta, runReport).
 *
 * requiredCreds: propertyId ("properties/XXXXXXXXX" or bare numeric id),
 *                oauthClientId, oauthClientSecret, refreshToken
 */
const { accessTokenFrom, requireCreds } = require('./lib/googleAuth');

const API_BASE = 'https://analyticsdata.googleapis.com/v1beta';
const ROW_LIMIT = 25;
const METRICS = [
    { name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' },
    { name: 'averageSessionDuration' }, { name: 'bounceRate' }, { name: 'conversions' },
];

const day = (d) => d.toISOString().slice(0, 10);

function propertyResource(propertyId) {
    const id = String(propertyId);
    return id.startsWith('properties/') ? id : `properties/${id}`;
}

async function runReport(property, token, body) {
    const res = await fetch(`${API_BASE}/${property}:runReport`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`GA4 runReport failed: HTTP ${res.status}`);
    return res.json();
}

/** Map a GA4 report's rows to metric records. dimKey labels the breakdown dimension (null = site total). */
function rowsToMetrics(json, dimKey, periodStart, periodEnd) {
    const metricNames = (json.metricHeaders || []).map((h) => h.name);
    const out = [];
    for (const row of (json.rows || [])) {
        const dims = dimKey ? { [dimKey]: (row.dimensionValues && row.dimensionValues[0] && row.dimensionValues[0].value) || '(not set)' } : {};
        (row.metricValues || []).forEach((mv, i) => {
            const value = Number(mv.value);
            if (Number.isFinite(value)) out.push({ metric: metricNames[i], dims, value, granularity: 'range', periodStart, periodEnd });
        });
    }
    return out;
}

module.exports = {
    id: 'ga4',
    provider: 'ga4',
    category: 'traffic',
    requiredCreds: ['propertyId', 'oauthClientId', 'oauthClientSecret', 'refreshToken'],

    validate(creds) { requireCreds(creds, this.requiredCreds, 'GA4'); },

    async sync({ creds, since, until, logger }) {
        const merged = { ...(creds.config || {}), ...(creds.secrets || {}), ...creds };
        this.validate(merged);
        const property = propertyResource(merged.propertyId);
        const startDate = day(since);
        const endDate = day(until);
        const token = await accessTokenFrom(merged);

        const out = [];
        const totals = await runReport(property, token, { dateRanges: [{ startDate, endDate }], metrics: METRICS });
        out.push(...rowsToMetrics(totals, null, startDate, endDate));

        for (const [dimension, dimKey] of [['pagePath', 'page'], ['country', 'country'], ['sessionDefaultChannelGroup', 'channel']]) {
            const report = await runReport(property, token, {
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: dimension }],
                metrics: METRICS,
                limit: ROW_LIMIT,
                orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            });
            out.push(...rowsToMetrics(report, dimKey, startDate, endDate));
        }

        logger.debug({ metrics: out.length }, 'GA4 sync fetched rows');
        return out;
    },
};
