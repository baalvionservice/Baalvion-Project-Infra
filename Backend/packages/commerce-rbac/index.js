'use strict';
// @baalvion/commerce-rbac — the single, shared commerce-domain RBAC Policy Enforcement Point.
// RBAC (rbac-service) remains the source of truth; this package holds the enforcement logic
// ONCE so commerce-service, order-service and inventory-service never duplicate it.
//
// Wiring (per service):
//   const { createRbacClient, createScopeResolver, createPep, createAuditEmitter,
//           createRbacStoreCountryResolver, CAPABILITY } = require('@baalvion/commerce-rbac');
//   const rbacClient = createRbacClient({ ...config.rbac, AppError });
//   const audit = createAuditEmitter({ service, redis });
//   const scope = createScopeResolver({ rbacClient, cache, config: config.rbac, audit });
//   const resolveStoreScope = createRbacStoreCountryResolver({ rbacClient, cache }); // order/inventory
//   const pep = createPep({ scope, resolveStoreScope, config: config.rbac, AppError, audit });
//   // → pep.loadStoreRole / pep.requireStoreRole / pep.loadAccessScope
const capability = require('./src/capability');
const { createRbacClient } = require('./src/rbacClient');
const { createScopeResolver } = require('./src/scope');
const { createRbacStoreCountryResolver } = require('./src/storeCountry');
const { createPep } = require('./src/pep');
const { createAuditEmitter, NOOP_AUDIT, STREAM_KEY } = require('./src/audit');
const { PepError, makeErrorFactory, isUnreachable } = require('./src/errors');

module.exports = {
    // factories
    createRbacClient,
    createScopeResolver,
    createRbacStoreCountryResolver,
    createPep,
    createAuditEmitter,
    // constants / vocabulary
    CAPABILITY: capability,
    COMMERCE_STORE_ROLES: capability.COMMERCE_STORE_ROLES,
    RBAC_ROLE_TO_CAPABILITY: capability.RBAC_ROLE_TO_CAPABILITY,
    STORE_ROLE_LEVEL: capability.STORE_ROLE_LEVEL,
    normCountry: capability.normCountry,
    // helpers / misc
    NOOP_AUDIT,
    AUDIT_STREAM_KEY: STREAM_KEY,
    PepError,
    makeErrorFactory,
    isUnreachable,
};
