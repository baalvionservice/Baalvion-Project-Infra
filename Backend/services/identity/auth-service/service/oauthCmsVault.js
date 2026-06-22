'use strict';

/**
 * Minimal CMS-vault client for OAuth credentials (mirrors proxy-service/cmsVault).
 *
 * Fetches this site's `oauth` integrations (decrypted) from the cms-service internal
 * resolver so the admin can manage Google/Facebook client id + secret from the CMS panel.
 * Per-site by `config.oauth.siteSlug`. Fail-soft: any error → null so oauthLogin falls
 * back to env vars. 60s in-process cache, reused as stale cache on fetch errors.
 */

const config = require('../config/appConfig');

const CMS_BASE_URL = String(config.oauth.cmsBaseUrl || '').replace(/\/$/, '');
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || '';
const SITE_SLUG = config.oauth.siteSlug || '';
const CACHE_TTL_MS = 60_000;

let cache = { fetchedAt: 0, byProvider: {} };

async function fetchAll() {
  // No site configured → nothing to resolve (env fallback handles it).
  if (!SITE_SLUG || !CMS_BASE_URL || !INTERNAL_SECRET) return {};
  if (Date.now() - cache.fetchedAt < CACHE_TTL_MS && Object.keys(cache.byProvider).length) {
    return cache.byProvider;
  }
  try {
    const res = await fetch(
      `${CMS_BASE_URL}/internal/integrations/${encodeURIComponent(SITE_SLUG)}?category=oauth`,
      { headers: { 'x-internal-secret': INTERNAL_SECRET, 'x-internal-service': 'auth-service' } },
    );
    if (!res.ok) return cache.byProvider;
    const json = await res.json().catch(() => ({}));
    const data = Array.isArray(json.data) ? json.data : [];
    const map = {};
    for (const e of data) if (e && e.provider) map[String(e.provider).toLowerCase()] = e;
    cache = { fetchedAt: Date.now(), byProvider: map };
    return map;
  } catch {
    return cache.byProvider;
  }
}

/** The vault entry for a provider key (e.g. 'google-oauth'), or null. */
async function getProvider(provider) {
  const map = await fetchAll();
  return map[String(provider || '').toLowerCase()] || null;
}

module.exports = { getProvider, SITE_SLUG };
