'use strict';

/**
 * Authorization guards. Run AFTER authMiddleware/apiKeyAuth and
 * requireOrganizationAccess so that `req.auth.role`/`permissions`/`scopes`
 * are already validated and authoritative.
 */

const { hasPermission } = require('../service/rbac');
const { AppError } = require('../utils/errors');

/** Require ALL listed permissions (wildcard '*' satisfies any). */
function requirePermissions(required = []) {
  const list = Array.isArray(required) ? required : [required];
  return (req, res, next) => {
    const perms = (req.auth && req.auth.permissions) || [];
    const missing = list.filter((p) => !hasPermission(perms, p));
    if (missing.length) {
      return next(new AppError('FORBIDDEN', `Missing permission(s): ${missing.join(', ')}`, 403));
    }
    return next();
  };
}

/** Require the caller's role to be one of the allowed roles. */
function requireRoles(allowed = []) {
  const list = Array.isArray(allowed) ? allowed : [allowed];
  return (req, res, next) => {
    const role = req.auth && req.auth.role;
    if (!role || !list.includes(role)) {
      return next(new AppError('FORBIDDEN', `Requires role: ${list.join(' | ')}`, 403));
    }
    return next();
  };
}

/** Require ALL listed scopes (only meaningful for API-key callers). */
function requireScopes(required = []) {
  const list = Array.isArray(required) ? required : [required];
  return (req, res, next) => {
    const scopes = (req.auth && req.auth.scopes) || [];
    if (scopes.includes('*')) return next();
    const missing = list.filter((s) => !scopes.includes(s));
    if (missing.length) {
      return next(new AppError('FORBIDDEN', `Missing scope(s): ${missing.join(', ')}`, 403));
    }
    return next();
  };
}

module.exports = { requirePermissions, requireRoles, requireScopes };
