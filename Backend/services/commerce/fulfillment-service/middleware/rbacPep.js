'use strict';
// fulfillment-service Policy Enforcement Point — the SHARED @baalvion/commerce-rbac PEP. Fulfillment
// does NOT own the store table, so store→country is resolved from the RBAC tenant tree. RBAC is
// the sole authority; write endpoints on shipments are store-scoped.
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
        redis.on('error', (e) => console.error('[fulfillment-service rbac]', e.message));
    }
    return redis;
}
const cache = {
    get: async (k) => { try { const v = await getRedis().get(k); return v ? JSON.parse(v) : null; } catch { return null; } },
    set: async (k, v, ttl) => { try { await getRedis().set(k, JSON.stringify(v), 'EX', ttl); } catch (e) { console.error('[fulfillment-service rbac] cache set failed (best-effort):', e.message); } },
    del: async (k) => { try { await getRedis().del(k); } catch (e) { console.error('[fulfillment-service rbac] cache del failed (best-effort):', e.message); } },
};

const rbacClient = createRbacClient({ ...config.rbac, AppError });
const audit = createAuditEmitter({ service: 'fulfillment-service', redis: getRedis() });
const scope = createScopeResolver({
    rbacClient, cache,
    config: { failMode: config.rbac.failMode, breakglassSuperAdmin: config.rbac.breakglassSuperAdmin, effectiveTtl: config.cache.rbacEffectiveTtl },
    audit, keyPrefix: 'fulfillment',
});
const resolveStoreScope = createRbacStoreCountryResolver({ rbacClient, cache, ttl: config.cache.rbacScopeTtl, keyPrefix: 'fulfillment' });
const pep = createPep({ scope, resolveStoreScope, config: { failMode: config.rbac.failMode }, AppError, audit });

module.exports = { loadStoreRole: pep.loadStoreRole, requireStoreRole: pep.requireStoreRole, loadAccessScope: pep.loadAccessScope };
