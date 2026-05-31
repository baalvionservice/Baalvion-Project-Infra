'use strict';
/**
 * Express middleware that establishes the tenant context for the rest of the
 * request. Place it AFTER your auth middleware (it reads req.auth).
 */
const { runWithTenant, getTenantContext } = require('./context');

/** Default: tenant from X-Tenant-Id header or req.auth.tenantId/orgId; bypass for super_admin. */
function defaultResolve(req, bypassRoles) {
    const auth = req.auth || {};
    const roles = Array.isArray(auth.roles) ? auth.roles : (auth.role != null ? [auth.role] : []);
    const bypass = roles.some((r) => bypassRoles.includes(r)) || req.internal === true;
    const tenantId = req.headers['x-tenant-id'] || auth.tenantId || auth.orgId || auth.org_id || null;
    return { tenantId: tenantId ? String(tenantId) : null, bypass };
}

/**
 * @param {object} [opts]
 * @param {(req, bypassRoles:string[]) => {tenantId, bypass}} [opts.resolve]
 * @param {string[]} [opts.bypassRoles=['super_admin']]
 */
function tenantMiddleware(opts = {}) {
    const resolve = opts.resolve || defaultResolve;
    const bypassRoles = opts.bypassRoles || ['super_admin'];
    return (req, _res, next) => {
        let ctx;
        try { ctx = resolve(req, bypassRoles); } catch { ctx = { tenantId: null, bypass: false }; }
        req.tenant = ctx;
        runWithTenant(ctx, () => next());
    };
}

/** Guard: reject requests with neither a tenant nor bypass (fail-closed). */
function requireTenant(req, res, next) {
    const { tenantId, bypass } = getTenantContext();
    if (!tenantId && !bypass) {
        const err = new Error('Tenant context required');
        err.status = err.statusCode = 400;
        err.code = 'TENANT_REQUIRED';
        return next(err);
    }
    return next();
}

module.exports = { tenantMiddleware, requireTenant, defaultResolve };
