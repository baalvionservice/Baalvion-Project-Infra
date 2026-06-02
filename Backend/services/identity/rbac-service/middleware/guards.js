'use strict';
const authzService = require('../services/authzService');
const roleService = require('../services/roleService');
const { Errors } = require('../utils/errors');

const asGuard = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).then((ok) => {
    if (ok === true) return next();
    return next(ok || Errors.forbidden());
}).catch(next);

/** Platform-wide operations (create country tenants, global policies, etc.). */
const requireSuperAdmin = asGuard(async (req) => {
    if (!req.auth) return Errors.unauthorized();
    return (await authzService.isSuperAdmin(req)) || Errors.forbidden('Requires super_admin');
});

/**
 * Guard for tenant-scoped management. `getTenantId(req)` returns (sync or async)
 * the id of the tenant the request targets. super_admin always passes; otherwise
 * the caller must administer that tenant (country admin over the subtree, org
 * admin over the org).
 */
const requireTenantAdmin = (getTenantId) => asGuard(async (req) => {
    if (!req.auth) return Errors.unauthorized();
    const tenantId = await getTenantId(req);
    if (!tenantId) return Errors.badRequest('Target tenant could not be determined');
    return (await authzService.canManageTenant(req, tenantId)) || Errors.forbidden('You do not administer this tenant');
});

/**
 * Guard for granting/revoking roles at a scope. `getScope(req)` returns
 * { scopeType, scopeId }. super_admin always passes; country/org admins pass for
 * scopes within their reach.
 */
const requireScopeAdmin = (getScope) => asGuard(async (req) => {
    if (!req.auth) return Errors.unauthorized();
    const { scopeType, scopeId } = await getScope(req);
    return (await authzService.canManageScope(req, scopeType, scopeId)) || Errors.forbidden('You do not administer this scope');
});

/** Convenience: resolve the target tenant from a :id role param. */
const tenantOfRoleParam = async (req) => {
    const role = await roleService.getRole(req.params.id);
    return role.tenant_id;
};

module.exports = { requireSuperAdmin, requireTenantAdmin, requireScopeAdmin, tenantOfRoleParam };
