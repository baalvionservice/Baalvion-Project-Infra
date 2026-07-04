'use strict';
/**
 * X (Twitter) Ads connector (Ads API — Account Stats).
 *
 * The X Ads API authenticates with OAuth 1.0a user-context signing (NOT a
 * simple bearer token) — a real API requirement, implemented here with
 * node:crypto (no extra dependency).
 *
 * requiredCreds: apiKey, apiSecretKey, accessToken, accessTokenSecret, adAccountId
 */
const crypto = require('node:crypto');
const { requireCreds } = require('./lib/googleAuth');

const API_BASE = 'https://ads-api.x.com/12';
const day = (d) => d.toISOString().slice(0, 10);

function percentEncode(str) {
    return encodeURIComponent(str).replace(/[!*'()]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

/** Build the OAuth 1.0a Authorization header for one signed GET request. */
function oauth1Header(method, url, params, creds) {
    const oauthParams = {
        oauth_consumer_key: creds.apiKey,
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: String(Math.floor(Date.now() / 1000)),
        oauth_token: creds.accessToken,
        oauth_version: '1.0',
    };
    const allParams = { ...oauthParams, ...params };
    const baseString = [
        method.toUpperCase(),
        percentEncode(url),
        percentEncode(Object.keys(allParams).sort().map((k) => `${percentEncode(k)}=${percentEncode(String(allParams[k]))}`).join('&')),
    ].join('&');
    const signingKey = `${percentEncode(creds.apiSecretKey)}&${percentEncode(creds.accessTokenSecret)}`;
    const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
    const headerParams = { ...oauthParams, oauth_signature: signature };
    return 'OAuth ' + Object.keys(headerParams).sort()
        .map((k) => `${percentEncode(k)}="${percentEncode(headerParams[k])}"`).join(', ');
}

module.exports = {
    id: 'x-pixel',
    provider: 'x-pixel',
    category: 'marketing',
    requiredCreds: ['apiKey', 'apiSecretKey', 'accessToken', 'accessTokenSecret', 'adAccountId'],

    validate(creds) { requireCreds(creds, this.requiredCreds, 'X (Twitter)'); },

    async sync({ creds, since, until, logger }) {
        const merged = { ...(creds.config || {}), ...(creds.secrets || {}), ...creds };
        this.validate(merged);
        const startDate = day(since);
        const endDate = day(until);

        const url = `${API_BASE}/stats/accounts/${merged.adAccountId}`;
        const params = {
            entity: 'ACCOUNT', entity_ids: merged.adAccountId,
            start_time: `${startDate}T00:00:00Z`, end_time: `${endDate}T23:59:59Z`,
            granularity: 'TOTAL', metric_groups: 'ENGAGEMENT,BILLING',
        };
        const authHeader = oauth1Header('GET', url, params, merged);
        const res = await fetch(`${url}?${new URLSearchParams(params).toString()}`, { headers: { Authorization: authHeader } });
        if (!res.ok) throw new Error(`X Ads stats failed: HTTP ${res.status}`);
        const json = await res.json();
        const idData = (json.data && json.data[0] && json.data[0].id_data && json.data[0].id_data[0]) || {};
        const metrics = idData.metrics || {};
        const sum = (arr) => (Array.isArray(arr) ? arr.reduce((a, v) => a + Number(v || 0), 0) : 0);

        const out = [
            { metric: 'impressions', dims: {}, value: sum(metrics.impressions), granularity: 'range', periodStart: startDate, periodEnd: endDate },
            { metric: 'clicks', dims: {}, value: sum(metrics.clicks), granularity: 'range', periodStart: startDate, periodEnd: endDate },
            { metric: 'spend', dims: {}, value: sum(metrics.billed_charge_local_micro) / 1_000_000, granularity: 'range', periodStart: startDate, periodEnd: endDate },
        ];
        logger.debug({ ok: res.ok }, 'X Ads sync complete');
        return out;
    },
};
