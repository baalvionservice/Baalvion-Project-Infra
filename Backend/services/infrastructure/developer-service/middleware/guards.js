'use strict';
const { Errors } = require('../utils/errors');

// Managing API keys / webhooks / specs is privileged. Service principals pass.
const DEV_ROLES = ['super_admin', 'owner', 'admin', 'developer', 'service'];

const requireDeveloper = (req, res, next) => {
    if (!req.auth) return next(Errors.unauthorized());
    if (req.internal) return next();
    const roles = req.auth.roles || [];
    const perms = req.auth.permissions || [];
    const ok = roles.some((r) => DEV_ROLES.includes(r)) || perms.includes('*') || perms.includes('developer:read') || perms.includes('developer:write');
    return ok ? next() : next(Errors.forbidden('Requires a developer role or developer:* permission'));
};

// Scope a query to the caller's org unless they are a platform-wide admin.
const orgScope = (req) => {
    const roles = req.auth?.roles || [];
    const perms = req.auth?.permissions || [];
    const isPlatform = req.internal || roles.includes('super_admin') || roles.includes('owner') || perms.includes('*');
    return isPlatform ? null : (req.auth?.orgId ?? null);
};

module.exports = { requireDeveloper, orgScope };
