'use strict';
const { Errors } = require('../utils/errors');

// Authoring/running reports is privileged. Service principals (internal key) pass.
const REPORT_ROLES = ['super_admin', 'owner', 'admin', 'analyst', 'finance', 'service'];

const requireReportRole = (req, res, next) => {
    if (!req.auth) return next(Errors.unauthorized());
    if (req.internal) return next();
    const roles = req.auth.roles || [];
    const perms = req.auth.permissions || [];
    const ok = roles.some((r) => REPORT_ROLES.includes(r)) || perms.includes('*') || perms.includes('reports:read') || perms.includes('reports:write');
    return ok ? next() : next(Errors.forbidden('Requires a report role or reports:* permission'));
};

// Scope a query to the caller's org unless they are a platform-wide admin.
const orgScope = (req) => {
    const roles = req.auth?.roles || [];
    const perms = req.auth?.permissions || [];
    const isPlatform = req.internal || roles.includes('super_admin') || roles.includes('owner') || perms.includes('*');
    return isPlatform ? null : (req.auth?.orgId ?? null);
};

module.exports = { requireReportRole, orgScope };
