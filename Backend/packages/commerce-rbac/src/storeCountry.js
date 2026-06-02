'use strict';
// Service-agnostic store → country resolver, sourced purely from the RBAC tenant tree
// (store tenant external_ref=storeId → parent country tenant external_ref=ISO-2). This lets
// services that do NOT own the commerce store table (order, inventory) resolve a store's
// country for the scope chain without a commerce-DB dependency.
const { normCountry } = require('./capability');

const asRows = (r) => (Array.isArray(r) ? r : (r && r.data) || []);

/**
 * @param {object} deps
 * @param {object} deps.rbacClient
 * @param {object} deps.cache       { get, set }
 * @param {number} [deps.ttl=300]
 * @param {string} [deps.keyPrefix='commerce-rbac']
 * @returns {(storeId:string, opts?:{token?:string,internal?:boolean}) => Promise<{id,countryCode,status}|null>}
 */
function createRbacStoreCountryResolver({ rbacClient, cache, ttl = 300, keyPrefix = 'commerce-rbac' } = {}) {
    async function countryMap(opts) {
        const ck = `${keyPrefix}:countries`;
        const cached = await cache.get(ck);
        if (cached) return cached;
        const rows = asRows(await rbacClient.listTenants({ type: 'country' }, opts));
        const map = {};
        for (const t of rows) map[t.id] = normCountry(t.externalRef ?? t.external_ref);
        await cache.set(ck, map, ttl);
        return map;
    }

    return async function resolveStoreScope(storeId, opts = {}) {
        if (!storeId) return null;
        const ck = `${keyPrefix}:storecountry:${storeId}`;
        const cached = await cache.get(ck);
        if (cached) return cached;

        const orgRows = asRows(await rbacClient.listTenants({ type: 'organization' }, opts));
        const org = orgRows.find((t) => (t.externalRef ?? t.external_ref) === storeId);
        if (!org) return null; // store not mirrored into RBAC → treat as unknown (caller 404s)

        const countries = await countryMap(opts);
        const parentId = org.parentId ?? org.parent_id;
        const countryCode = countries[parentId] || null;
        if (!countryCode) {
            // Misconfigured RBAC tenant tree (store has no resolvable country parent). Access
            // stays SAFE — only '*' (platform) and storeId scopes will match in the scope chain,
            // never a country grant — but surface it so ops can fix the tenant tree. Not cached.
            // eslint-disable-next-line no-console
            console.warn(JSON.stringify({ audit: true, type: 'commerce.store_country_unresolved', storeId, parentId: parentId ?? null }));
        }
        const data = { id: storeId, countryCode, organizationId: null, status: org.status };
        if (countryCode) await cache.set(ck, data, ttl); // only cache fully-resolved mappings
        return data;
    };
}

module.exports = { createRbacStoreCountryResolver };
