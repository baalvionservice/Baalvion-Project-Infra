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

// Platform-level role gate for CROSS-STORE endpoints (e.g. an all-stores category or product
// listing). The store-scoped PEP (loadStoreRole/requireStoreRole) is the wrong authority for an
// all-stores query — it 403s without a per-store role. Mirrors order-service's
// middleware/rbacPep.js requirePlatformAdmin exactly: admits only platform-tier roles from the
// JWT roles[]/role claim. A store_viewer-only or guest token is rejected 403/401.
const PLATFORM_ADMIN_ROLES = new Set(['super_admin', 'country_admin']);
const requirePlatformAdmin = (req, res, next) => {
    if (!req.auth) return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
    const roles = [req.auth.role, ...(Array.isArray(req.auth.roles) ? req.auth.roles : [])].filter(Boolean);
    if (!roles.some((r) => PLATFORM_ADMIN_ROLES.has(r))) {
        return next(new AppError('FORBIDDEN', 'Platform admin role required (super_admin or country_admin)', 403));
    }
    return next();
};

module.exports = { rbacClient, scope, pep, audit, loadStoreScope, requirePlatformAdmin };
