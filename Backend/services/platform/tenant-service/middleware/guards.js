'use strict';
const { Errors } = require('../utils/errors');

// Managing tenants/branding/domains/entitlements is privileged. Service principals pass.
const TENANT_ROLES = ['super_admin', 'owner', 'admin', 'country_admin', 'organization_admin', 'service'];

const requireTenantAdmin = (req, res, next) => {
    if (!req.auth) return next(Errors.unauthorized());
    if (req.internal) return next();
    const roles = req.auth.roles || [];
    const perms = req.auth.permissions || [];
    const ok = roles.some((r) => TENANT_ROLES.includes(r)) || perms.includes('*') || perms.includes('tenant:write') || perms.includes('tenant:read');
    return ok ? next() : next(Errors.forbidden('Requires a tenant-admin role or tenant:* permission'));
};

// Platform-wide admins see all tenants; org admins are scoped to their own org's tenants.
const orgScope = (req) => {
    const roles = req.auth?.roles || [];
    const perms = req.auth?.permissions || [];
    const isPlatform = req.internal || roles.includes('super_admin') || roles.includes('owner') || perms.includes('*');
    return isPlatform ? null : (req.auth?.orgId ?? null);
};

module.exports = { requireTenantAdmin, orgScope };
