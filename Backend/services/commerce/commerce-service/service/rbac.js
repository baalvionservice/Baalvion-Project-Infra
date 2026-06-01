'use strict';
// Commerce-service wiring of the shared @baalvion/commerce-rbac PEP. The RBAC enforcement
// logic lives ONCE in the package; this module injects commerce's cache, config, error class,
// audit sink, and — uniquely — the DB-authoritative store→country resolver (commerce owns the
// store table). service/rbacClient.js, service/commerceAuthz.js and middleware/commerceAccess.js
// are thin re-exports of what is constructed here, so existing import paths keep working.
const {
    createRbacClient,
    createScopeResolver,
    createPep,
    createAuditEmitter,
    normCountry,
} = require('@baalvion/commerce-rbac');
const config = require('../config/appConfig');
const cache = require('./cacheService');
const { AppError } = require('../utils/errors');
const { CommerceStore } = require('../models');

// Commerce is the system of record for stores → resolve country from the local table (cached).
async function loadStoreScope(storeId) {
    if (!storeId) return null;
    const cacheKey = `commerce:rbac:scope:${storeId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
    const store = await CommerceStore.findByPk(storeId, { attributes: ['id', 'countryCode', 'organizationId', 'status'] });
    if (!store) return null;
    const data = { id: store.id, countryCode: normCountry(store.countryCode), organizationId: store.organizationId, status: store.status };
    await cache.set(cacheKey, data, config.cache.rbacScopeTtl);
    return data;
}

let redis = null;
try { redis = cache.getClient(); } catch { /* audit falls back to stdout only */ }

const rbacClient = createRbacClient({ ...config.rbac, AppError });
const audit = createAuditEmitter({ service: 'commerce-service', redis });
const scope = createScopeResolver({
    rbacClient,
    cache,
    config: { failMode: config.rbac.failMode, breakglassSuperAdmin: config.rbac.breakglassSuperAdmin, effectiveTtl: config.cache.rbacEffectiveTtl },
    audit,
    keyPrefix: 'commerce',
});
const pep = createPep({ scope, resolveStoreScope: (storeId) => loadStoreScope(storeId), config: { failMode: config.rbac.failMode }, AppError, audit });

module.exports = { rbacClient, scope, pep, audit, loadStoreScope };
