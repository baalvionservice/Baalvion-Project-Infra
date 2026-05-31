'use strict';
const { Errors } = require('../utils/errors');

// Reading the audit trail is privileged: super_admin, an explicit audit role, or
// the `audit:read`/`*` permission. Service principals (internal key) also pass.
const AUDIT_ROLES = ['super_admin', 'owner', 'admin', 'auditor', 'compliance', 'service'];

const requireAuditReader = (req, res, next) => {
    if (!req.auth) return next(Errors.unauthorized());
    if (req.internal) return next();
    const roles = req.auth.roles || [];
    const perms = req.auth.permissions || [];
    const ok = roles.some((r) => AUDIT_ROLES.includes(r)) || perms.includes('*') || perms.includes('audit:read');
    return ok ? next() : next(Errors.forbidden('Requires an audit-reader role or audit:read permission'));
};

module.exports = { requireAuditReader };
