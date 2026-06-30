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
// Fail-fast: refuse to boot in production with the committed, publicly-known dev secret. This module
// presents x-internal-secret to the CMS to retrieve DECRYPTED PSP keys, so a default/unset secret would
// let anyone who knows the literal impersonate proxy-service and pull live merchant credentials. Mirrors
// the identical guard in routes/billingRoutes.js (and payment-service/cms-service appConfig). Caught at
// deploy, never silently authenticating with a public string at the first vault read.
if (process.env.NODE_ENV === 'production' && (!process.env.INTERNAL_SERVICE_SECRET || INTERNAL_SECRET === 'baalvion-internal-dev-secret')) {
    throw new Error('INTERNAL_SERVICE_SECRET must be set to a non-default value in production (cms-vault)');
}
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

/**
 * Payment-provider keys (lowercase) that are ENABLED + CONFIGURED in this site's vault. Lets the BFF
 * tell the SPA which gateways can actually charge so it only offers those. Returns [] on any vault
 * error (caller then degrades to showing all gateways). The Java payment-service still resolves the
 * actual keys at charge time — this is purely a UI hint.
 */
async function listConfiguredProviders() {
    const map = await fetchAll();
    const out = [];
    for (const [provider, e] of Object.entries(map)) {
        if (!e) continue;
        const isPayment = e.category === 'payment' || e.category == null;
        const enabled = e.enabled !== false;
        const configured = e.status === 'configured' || e.status == null;
        if (isPayment && enabled && configured) out.push(provider);
    }
    return out;
}

module.exports = { getProvider, getSecret, listConfiguredProviders, SITE_SLUG };
