'use strict';
/**
 * Google AdSense connector (Ads/monetization intelligence).
 *
 * Official AdSense Management API v2 reports:generate. Pulls site-level earnings,
 * RPM, CPC, clicks and impressions for the sync window, plus a daily trend.
 * Credentials live encrypted in the CMS vault (provider `adsense`, category
 * `analytics`). AdSense publisher ID is the same one managed under Website → SEO →
 * Monetization; OAuth (clientId/secret/refreshToken) authorizes the reporting read.
 *
 * requiredCreds: accountId ("pub-XXXXXXXXXXXXXXXX"), oauthClientId,
 *                oauthClientSecret, refreshToken
 */
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API_BASE = 'https://adsense.googleapis.com/v2';
const METRICS = ['ESTIMATED_EARNINGS', 'PAGE_VIEWS_RPM', 'CLICKS', 'IMPRESSIONS', 'COST_PER_CLICK', 'PAGE_VIEWS'];
const METRIC_KEY = {
    ESTIMATED_EARNINGS: 'earnings',
    PAGE_VIEWS_RPM: 'rpm',
    CLICKS: 'clicks',
    IMPRESSIONS: 'impressions',
    COST_PER_CLICK: 'cpc',
    PAGE_VIEWS: 'pageviews',
};

const d = (date) => ({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() });

async function accessTokenFrom(creds) {
    const body = new URLSearchParams({
        client_id: creds.oauthClientId,
        client_secret: creds.oauthClientSecret,
        refresh_token: creds.refreshToken,
        grant_type: 'refresh_token',
    });
    const res = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    if (!res.ok) throw new Error(`AdSense token exchange failed: HTTP ${res.status}`);
    const json = await res.json();
    if (!json.access_token) throw new Error('AdSense token exchange returned no access_token');
    return json.access_token;
}

function accountResource(accountId) {
    const id = String(accountId);
    return id.startsWith('accounts/') ? id : `accounts/${id}`;
}

async function report(account, token, { since, until, dimensions }) {
    const s = d(since);
    const e = d(until);
    const params = new URLSearchParams();
    params.set('startDate.year', String(s.year));
    params.set('startDate.month', String(s.month));
    params.set('startDate.day', String(s.day));
    params.set('endDate.year', String(e.year));
    params.set('endDate.month', String(e.month));
    params.set('endDate.day', String(e.day));
    for (const m of METRICS) params.append('metrics', m);
    for (const dim of (dimensions || [])) params.append('dimensions', dim);

    const url = `${API_BASE}/${account}/reports:generate?${params.toString()}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`AdSense report failed: HTTP ${res.status}`);
    return res.json();
}

/** Map a report's totals row → metric records keyed by header name. */
function totalsToMetrics(json, dims, periodStart, periodEnd) {
    const headers = json.headers || [];
    const cells = (json.totals && json.totals.cells) || [];
    const out = [];
    headers.forEach((h, i) => {
        const key = METRIC_KEY[h.name];
        if (!key) return;
        const raw = cells[i] && cells[i].value;
        const value = raw == null ? 0 : Number(raw);
        if (Number.isFinite(value)) out.push({ metric: key, dims, value, granularity: 'range', periodStart, periodEnd });
    });
    return out;
}

module.exports = {
    id: 'adsense',
    provider: 'adsense',
    category: 'marketing',
    requiredCreds: ['accountId', 'oauthClientId', 'oauthClientSecret', 'refreshToken'],

    validate(creds) {
        for (const k of this.requiredCreds) {
            if (!creds || !creds[k]) throw new Error(`AdSense connector missing credential: ${k}`);
        }
    },

    async sync({ creds, since, until, logger }) {
        const merged = { ...(creds.config || {}), ...(creds.secrets || {}), ...creds };
        this.validate(merged);
        const account = accountResource(merged.accountId);
        const startDate = since.toISOString().slice(0, 10);
        const endDate = until.toISOString().slice(0, 10);

        const token = await accessTokenFrom(merged);
        const totals = await report(account, token, { since, until });
        const out = totalsToMetrics(totals, {}, startDate, endDate);

        logger.debug({ metrics: out.length }, 'AdSense sync fetched totals');
        return out;
    },
};
