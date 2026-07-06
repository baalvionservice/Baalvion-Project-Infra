'use strict';
/**
 * Website registry for the analytics hot path.
 *
 * Resolves a site key (slug or UUID) to the tenant identity + analytics config a
 * collected event needs: { websiteId, organizationId, slug, domain, enabled,
 * modules }. Backed by a tiny in-process TTL cache so the collector never hits
 * Postgres per event — each API/worker replica caches independently, which is
 * exactly what we want for horizontal scaling.
 *
 * Analytics is gated per site by cms_websites.config.enableAnalytics (the toggle
 * that already exists), and per module by config.analytics.modules[]. A brand-new
 * website becomes fully tracked by config alone — no code change.
 */
const { CmsWebsite } = require('../../models');

const TTL_MS = Number(process.env.ANALYTICS_REGISTRY_TTL_MS || 60_000);
const _cache = new Map(); // key -> { value, expires }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Default module set when a site enables analytics without an explicit list.
const DEFAULT_MODULES = ['traffic', 'content', 'seo'];

function _fromRow(row) {
    const config = row.config || {};
    const analytics = config.analytics || {};
    return {
        websiteId: row.id,
        organizationId: row.organizationId,
        slug: row.slug,
        domain: row.domain || null,
        // enableAnalytics defaults true in the website schema; treat undefined as on.
        enabled: config.enableAnalytics !== false,
        modules: Array.isArray(analytics.modules) && analytics.modules.length ? analytics.modules : DEFAULT_MODULES,
        salt: analytics.visitorSalt || row.id, // per-site salt for cookieless ids
        consentMode: analytics.consentMode === 'strict' ? 'strict' : 'implied',
    };
}

async function _load(key) {
    const where = UUID_RE.test(key) ? { id: key } : { slug: key };
    const row = await CmsWebsite.findOne({
        where,
        attributes: ['id', 'organizationId', 'slug', 'domain', 'config', 'status'],
    });
    if (!row || row.status === 'archived') return null;
    return _fromRow(row);
}

/** Resolve a site key (slug|UUID) to its analytics identity, or null. Cached. */
async function resolve(key) {
    if (!key) return null;
    const cacheKey = String(key).toLowerCase();
    const hit = _cache.get(cacheKey);
    const now = Date.now();
    if (hit && hit.expires > now) return hit.value;

    const value = await _load(cacheKey);
    _cache.set(cacheKey, { value, expires: now + TTL_MS }); // cache negatives too (short TTL)
    return value;
}

/** Whether a given module is enabled for a resolved site. */
function moduleEnabled(site, module) {
    return !!site && site.enabled && site.modules.includes(module);
}

/** Drop a site from the cache (called on config/integration change events). */
function invalidate(key) {
    if (!key) { _cache.clear(); return; }
    _cache.delete(String(key).toLowerCase());
}

module.exports = { resolve, moduleEnabled, invalidate, DEFAULT_MODULES };
