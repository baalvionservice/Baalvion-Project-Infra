'use strict';
/**
 * Per-request tenant context via AsyncLocalStorage. Set once by the middleware,
 * read by withTenantTransaction/withTenantClient so DB calls inherit the tenant
 * without threading it through every function.
 */
const { AsyncLocalStorage } = require('async_hooks');

const als = new AsyncLocalStorage();

const EMPTY = Object.freeze({ tenantId: null, bypass: false });

function runWithTenant(ctx, fn) {
    return als.run({ tenantId: ctx?.tenantId ?? null, bypass: !!ctx?.bypass }, fn);
}

function getTenantContext() {
    return als.getStore() || EMPTY;
}

module.exports = { als, runWithTenant, getTenantContext, EMPTY };
