'use strict';

/**
 * Hierarchical, roles[]-aware RBAC guards (Phase 3 canonical).
 *
 * Mirrors the @baalvion/rbac hierarchy but lives here in auth-node because:
 *   (a) auth-node is pure JS and always resolvable from CJS services (no build step),
 *   (b) the canonical req.auth carries roles[] (an array), whereas @baalvion/rbac's
 *       guards assume a scalar role.
 *
 * Enforcement is hierarchical: a caller's HIGHEST role must meet the requirement,
 * and `super_admin` satisfies every check.
 */

const ROLE_HIERARCHY = ['viewer', 'member', 'editor', 'manager', 'admin', 'owner', 'super_admin'];

const ROLE_PERMISSIONS = {
  viewer:      ['read:self'],
  member:      ['read:self', 'read:org', 'write:self'],
  editor:      ['read:self', 'read:org', 'write:self', 'write:org'],
  manager:     ['read:self', 'read:org', 'write:self', 'write:org', 'manage:members'],
  admin:       ['read:self', 'read:org', 'write:self', 'write:org', 'manage:members', 'manage:org', 'manage:api_keys'],
  owner:       ['read:self', 'read:org', 'write:self', 'write:org', 'manage:members', 'manage:org', 'manage:api_keys', 'manage:billing', 'delete:org'],
  super_admin: ['*'],
};

function err(status, code, message) {
  const e = new Error(message || code);
  e.name = 'AuthError';
  e.status = status;
  e.statusCode = status;
  e.code = code;
  return e;
}

function roleLevel(role) { return ROLE_HIERARCHY.indexOf(role); }

/** Roles array from req.auth — canonical roles[], with scalar `role` fallback. */
function authRoles(req) {
  const a = (req && req.auth) || {};
  if (Array.isArray(a.roles)) return a.roles;
  if (a.role != null) return [a.role];
  return [];
}

function maxLevel(roles) { return roles.reduce((m, r) => Math.max(m, roleLevel(r)), -1); }

/** True if the caller's highest role is >= the required role. */
function isRoleAtLeast(roles, required) { return maxLevel(roles) >= roleLevel(required); }

function hasPermission(req, permission) {
  const a = (req && req.auth) || {};
  const roles = authRoles(req);
  if (roles.includes('super_admin')) return true;
  const perms = Array.isArray(a.permissions) ? a.permissions : [];
  if (perms.includes('*') || perms.includes(permission)) return true;
  return roles.some((r) => {
    const rp = ROLE_PERMISSIONS[r] || [];
    return rp.includes('*') || rp.includes(permission);
  });
}

/** Express guard: caller must hold AT LEAST one of `roles` (hierarchical). */
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.auth) return next(err(401, 'unauthorized', 'Authentication required'));
    const userRoles = authRoles(req);
    const ok = userRoles.includes('super_admin') || roles.some((r) => isRoleAtLeast(userRoles, r));
    if (!ok) return next(err(403, 'forbidden', `Requires role: ${roles.join(' or ')}`));
    return next();
  };
}

/** Express guard: caller must hold AT LEAST one of `permissions`. */
function requirePermission(...permissions) {
  return (req, _res, next) => {
    if (!req.auth) return next(err(401, 'unauthorized', 'Authentication required'));
    if (!permissions.some((p) => hasPermission(req, p))) {
      return next(err(403, 'forbidden', `Requires permission: ${permissions.join(' or ')}`));
    }
    return next();
  };
}

const requireSuperAdmin = requireRole('super_admin');
const requireOrgAdmin = requireRole('admin', 'owner', 'super_admin');

module.exports = {
  ROLE_HIERARCHY, ROLE_PERMISSIONS,
  roleLevel, isRoleAtLeast, hasPermission,
  requireRole, requirePermission, requireSuperAdmin, requireOrgAdmin,
};
