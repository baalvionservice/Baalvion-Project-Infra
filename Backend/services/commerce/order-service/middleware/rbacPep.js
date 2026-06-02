'use strict';
// order-service Policy Enforcement Point — the SHARED @baalvion/commerce-rbac PEP, wired with
// this service's config/error class and a dedicated RBAC cache. order-service does NOT own the
// store table, so store→country is resolved from the RBAC tenant tree. RBAC is the sole authority.
const Redis = require('ioredis');
const {
    createRbacClient,
    createScopeResolver,
    createPep,
    createAuditEmitter,
    createRbacStoreCountryResolver,
} = require('@baalvion/commerce-rbac');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');

let redis = null;
function getRedis() {
    if (!redis) {
        redis = new Redis({ host: config.redis.host, port: config.redis.port, password: config.redis.password || undefined, lazyConnect: true });
        redis.on('error', (e) => console.error('[order-service rbac]', e.message));
    }
    return redis;
}
const cache = {
    get: async (k) => { try { const v = await getRedis().get(k); return v ? JSON.parse(v) : null; } catch { return null; } },
    set: async (k, v, ttl) => { try { await getRedis().set(k, JSON.stringify(v), 'EX', ttl); } catch { /* cache is best-effort */ } },
    del: async (k) => { try { await getRedis().del(k); } catch { /* best-effort */ } },
};

const rbacClient = createRbacClient({ ...config.rbac, AppError });
const audit = createAuditEmitter({ service: 'order-service', redis: getRedis() });
const scope = createScopeResolver({
    rbacClient, cache,
    config: { failMode: config.rbac.failMode, breakglassSuperAdmin: config.rbac.breakglassSuperAdmin, effectiveTtl: config.cache.rbacEffectiveTtl },
    audit, keyPrefix: 'orders',
});
const resolveStoreScope = createRbacStoreCountryResolver({ rbacClient, cache, ttl: config.cache.rbacScopeTtl, keyPrefix: 'orders' });
const pep = createPep({ scope, resolveStoreScope, config: { failMode: config.rbac.failMode }, AppError, audit });

const jwtRolesOf = (req) => (Array.isArray(req.auth && req.auth.roles) ? req.auth.roles : (req.auth && req.auth.role != null ? [req.auth.role] : []));

// SOFT store-capability check for owner-OR-staff ownership enforcement (used by shopper
// endpoints that are also accessible to admins/staff). Resolves the caller's store capability
// WITHOUT denying; returns true if they hold ANY store role. RBAC outage → false, EXCEPT a
// super_admin JWT which resolveStoreCapability still grants (break-glass) → true. Never throws.
async function isStoreStaff(req) {
    if (!req.auth) return false;
    const storeId = req.params && req.params.storeId;
    const token = req.get && req.get('authorization');
    try {
        const store = await resolveStoreScope(storeId, { token });
        if (!store) return false;
        const cap = await scope.resolveStoreCapability({ userId: req.auth.userId, token, store, jwtRoles: jwtRolesOf(req) });
        return !!cap && cap.level > 0;
    } catch {
        return false; // RBAC unreachable → not staff; ownership still governs access.
    }
}

module.exports = {
    loadStoreRole: pep.loadStoreRole,
    requireStoreRole: pep.requireStoreRole,
    loadAccessScope: pep.loadAccessScope,
    isStoreStaff,
    audit,
};
