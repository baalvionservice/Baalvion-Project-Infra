'use strict';
// Mirrors commerce stores into the RBAC tenant tree so the hierarchy the user manages
// (Country → Store → Team) exists where RBAC's management guard can reason about it:
//
//   platform
//     └─ country   (type=country,       external_ref = ISO-2 country code)
//          └─ store (type=organization, external_ref = <storeId UUID>)
//
// A store tenant nesting under its country tenant is what lets canManageScope's tree-walk
// authorize a country_admin to assign store-team roles within their country.
const cache = require('./cacheService');
const rbacClient = require('./rbacClient');
const { AppError } = require('../utils/errors');
const { normCountry } = require('./commerceAuthz');

const COUNTRY_NAMES = {
    AE: 'United Arab Emirates', IN: 'India', US: 'United States', GB: 'United Kingdom',
    DE: 'Germany', SG: 'Singapore', SA: 'Saudi Arabia', QA: 'Qatar', KW: 'Kuwait',
    BH: 'Bahrain', CA: 'Canada', FR: 'France',
};

const asRows = (result) => (Array.isArray(result) ? result : (result && result.data) || []);

async function getPlatformTenantId(token) {
    const cached = await cache.get('commerce:rbac:platformTenant');
    if (cached) return cached;
    const rows = asRows(await rbacClient.listTenants({ type: 'platform' }, { token }));
    const platform = rows[0];
    if (!platform) throw new AppError('RBAC_NOT_PROVISIONED', 'No platform tenant exists in RBAC. Run the RBAC seed first.', 503);
    await cache.set('commerce:rbac:platformTenant', platform.id, 3600);
    return platform.id;
}

/** Find an existing tenant by (type, externalRef). */
async function findTenant(type, externalRef, token) {
    const rows = asRows(await rbacClient.listTenants({ type }, { token }));
    return rows.find((t) => t.externalRef === externalRef || t.external_ref === externalRef) || null;
}

/**
 * Ensure the country tenant exists. Creating a country tenant is super_admin-only (its
 * parent is the platform), so at runtime this should already exist from provisioning;
 * if it does not and the caller cannot create it, surface a clear, actionable error.
 */
async function ensureCountryTenant(countryCode, token) {
    const cc = normCountry(countryCode);
    const existing = await findTenant('country', cc, token);
    if (existing) return existing.id;
    try {
        const created = await rbacClient.createTenant(
            { type: 'country', externalRef: cc, name: COUNTRY_NAMES[cc] || `Country ${cc}` },
            { token },
        );
        return created.id;
    } catch (err) {
        if (err instanceof AppError && err.statusCode === 403) {
            throw new AppError('RBAC_COUNTRY_NOT_PROVISIONED',
                `Country '${cc}' is not provisioned in RBAC and only a super_admin can create it. Run scripts/provisionCommerceRbac.cjs.`, 409);
        }
        throw err;
    }
}

/** Ensure the store tenant (organization) exists under its country tenant. */
async function ensureStoreTenant({ storeId, countryCode, name }, token) {
    const existing = await findTenant('organization', storeId, token);
    if (existing) return existing.id;
    const countryTenantId = await ensureCountryTenant(countryCode, token);
    const created = await rbacClient.createTenant(
        { type: 'organization', parentId: countryTenantId, externalRef: storeId, name: name || `Store ${storeId}` },
        { token },
    );
    return created.id;
}

/** Ensure both country + store tenants exist for a store. Returns their ids. */
async function syncStoreToRbac(store, token) {
    const countryTenantId = await ensureCountryTenant(store.countryCode, token);
    const storeTenantId = await ensureStoreTenant(
        { storeId: store.id, countryCode: store.countryCode, name: store.name }, token,
    );
    return { countryTenantId, storeTenantId };
}

module.exports = { getPlatformTenantId, findTenant, ensureCountryTenant, ensureStoreTenant, syncStoreToRbac, COUNTRY_NAMES };
