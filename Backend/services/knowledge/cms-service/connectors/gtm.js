'use strict';
/**
 * Google Tag Manager connector.
 *
 * GTM has no traffic/analytics data of its own — it is a tag deployment system.
 * This connector syncs CONFIGURATION HEALTH signals instead: the live container
 * version's tag/trigger/variable counts. Real analytics for a site comes from
 * whatever GTM deploys (GA4, ad pixels, etc.) — connect those directly.
 *
 * requiredCreds: accountId, containerId, oauthClientId, oauthClientSecret, refreshToken
 */
const { accessTokenFrom, requireCreds } = require('./lib/googleAuth');

const API_BASE = 'https://www.googleapis.com/tagmanager/v2';

module.exports = {
    id: 'gtm',
    provider: 'gtm',
    category: 'traffic',
    requiredCreds: ['accountId', 'containerId', 'oauthClientId', 'oauthClientSecret', 'refreshToken'],

    validate(creds) { requireCreds(creds, this.requiredCreds, 'GTM'); },

    async sync({ creds, until, logger }) {
        const merged = { ...(creds.config || {}), ...(creds.secrets || {}), ...creds };
        this.validate(merged);
        const token = await accessTokenFrom(merged);
        const path = `accounts/${merged.accountId}/containers/${merged.containerId}`;

        const res = await fetch(`${API_BASE}/${path}/versions:live`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`GTM versions:live failed: HTTP ${res.status}`);
        const live = await res.json();

        const periodStart = until.toISOString().slice(0, 10);
        const snap = (metric, value) => ({ metric, dims: {}, value, granularity: 'snapshot', periodStart, periodEnd: periodStart });
        const out = [
            snap('liveTags', (live.tag || []).length),
            snap('liveTriggers', (live.trigger || []).length),
            snap('liveVariables', (live.variable || []).length),
            snap('containerVersionId', Number(live.containerVersionId) || 0),
        ];
        logger.debug({ tags: out[0].value }, 'GTM sync complete');
        return out;
    },
};
