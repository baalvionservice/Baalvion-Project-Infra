'use strict';
/**
 * Read-through client for the CMS "Integrations & Keys" vault — the SAME entries the central admin
 * panel writes (CMS → Websites → Integrations & Keys). Lets the payment webhooks verify with the
 * secret an admin pasted in the panel, so the panel is the single source of truth for keys (no
 * proxy env edits needed). Mirrors payment-service's CmsIntegrationsClient.
 *
 *   GET {CMS_BASE_URL}/internal/integrations/{slug}  header x-internal-secret  -> { data: [ ... ] }
 *
 * The internal resolver returns DECRYPTED secrets for service-to-service use. Results are cached
 * in-process for 60s; on any error the last good cache is reused (and the caller falls back to env).
 */
const config = require('../config/appConfig');
const logger = require('./logger');

const CMS_BASE_URL = (process.env.CMS_BASE_URL || 'http://localhost:3011/api/v1').replace(/\/$/, '');
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'baalvion-internal-dev-secret';
const SITE_SLUG = process.env.PAYMENT_SITE_SLUG || 'proxy-baalvionstack';
const CACHE_TTL_MS = 60_000;

let cache = { fetchedAt: 0, byProvider: {} };

async function fetchAll() {
    if (Date.now() - cache.fetchedAt < CACHE_TTL_MS && Object.keys(cache.byProvider).length) {
        return cache.byProvider;
    }
    try {
        const res = await fetch(`${CMS_BASE_URL}/internal/integrations/${encodeURIComponent(SITE_SLUG)}`, {
            headers: { 'x-internal-secret': INTERNAL_SECRET, 'x-internal-service': 'proxy-service' },
        });
        if (!res.ok) {
            logger.warn(`[cms-vault] integrations fetch HTTP ${res.status}; using ${Object.keys(cache.byProvider).length ? 'cached' : 'env-fallback'}`);
            return cache.byProvider;
        }
        const json = await res.json().catch(() => ({}));
        const data = Array.isArray(json.data) ? json.data : [];
        const map = {};
        for (const e of data) {
            if (e && e.provider) map[String(e.provider).toLowerCase()] = e;
        }
        cache = { fetchedAt: Date.now(), byProvider: map };
        return map;
    } catch (e) {
        logger.warn(`[cms-vault] integrations fetch error: ${e.message}; using ${Object.keys(cache.byProvider).length ? 'cached' : 'env-fallback'}`);
        return cache.byProvider;
    }
}

/** The full vault entry for a provider ({ provider, category, secrets:{...}, config:{mode,...} }) or null. */
async function getProvider(provider) {
    const map = await fetchAll();
    return map[String(provider || '').toLowerCase()] || null;
}

/** A single decrypted secret value (e.g. webhookSecret) from the provider's vault entry, or null. */
async function getSecret(provider, key) {
    const entry = await getProvider(provider);
    return entry && entry.secrets ? (entry.secrets[key] || null) : null;
}

module.exports = { getProvider, getSecret, SITE_SLUG };
