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

// ── Platform roles (C4) ─────────────────────────────────────────────────────────
// Global operator roles, a SEPARATE dimension from the per-organization ROLE_HIERARCHY above.
// A platform role is never an org-membership role and vice-versa (no dual-purpose names).
// Only PLATFORM_BYPASS_ROLES may bypass tenant (RLS) isolation; platform_support_admin is a
// platform role but intentionally gets no blanket data bypass. Mirrors @baalvion/tenancy roles.js.
const PLATFORM_ROLES = ['platform_admin', 'platform_security_admin', 'platform_support_admin'];
const PLATFORM_BYPASS_ROLES = ['platform_admin', 'platform_security_admin'];

const isPlatformRole = (role) => PLATFORM_ROLES.includes(role);

/** True if any of the caller's roles is a platform role allowed to bypass tenant isolation. */
function hasTenantBypass(roles) {
  const list = Array.isArray(roles) ? roles : (roles != null ? [roles] : []);
  return list.some((r) => PLATFORM_BYPASS_ROLES.includes(r));
}

/**
 * Issuance guard against role confusion: an organization-membership role must never be a
 * platform role. Throws if a tenant-scoped principal's role collides with the platform namespace.
 */
function assertNoRoleConfusion(membershipRole) {
  if (isPlatformRole(membershipRole)) {
    throw err(400, 'role_confusion', `Organization membership role must not be a platform role: '${membershipRole}'`);
  }
  return membershipRole;
}

/**
 * FUNCTIONAL roles — job-shaped roles the consoles offer (support, finance, compliance, …)
 * that were absent from ROLE_HIERARCHY. roleLevel() returned -1 for each, so anyone holding
 * ONLY one of these failed EVERY requireRole check while the UI still showed them the screens.
 *
 * Mapped onto an existing hierarchy tier rather than inserted INTO ROLE_HIERARCHY, because that
 * array's index IS the level — splicing a role in would silently renumber every tier above it.
 * Nothing is removed or reordered here; this is purely additive.
 */
const FUNCTIONAL_ROLE_TIER = {
  readonly:   'viewer',
  support:    'member',
  analyst:    'member',
  developer:  'editor',
  moderator:  'editor',
  compliance: 'manager',
  finance:    'manager',
};

const ROLE_PERMISSIONS = {
  viewer:      ['read:self'],
  member:      ['read:self', 'read:org', 'write:self'],
  editor:      ['read:self', 'read:org', 'write:self', 'write:org'],
  manager:     ['read:self', 'read:org', 'write:self', 'write:org', 'manage:members'],
  admin:       ['read:self', 'read:org', 'write:self', 'write:org', 'manage:members', 'manage:org', 'manage:api_keys'],
  owner:       ['read:self', 'read:org', 'write:self', 'write:org', 'manage:members', 'manage:org', 'manage:api_keys', 'manage:billing', 'delete:org'],
  super_admin: ['*'],

  // Functional roles: tier-equivalent permissions plus what the job actually needs.
  readonly:   ['read:self', 'read:org'],
  support:    ['read:self', 'read:org', 'read:users'],
  analyst:    ['read:self', 'read:org', 'read:analytics'],
  developer:  ['read:self', 'read:org', 'write:self', 'manage:api_keys'],
  moderator:  ['read:self', 'read:org', 'write:self', 'write:org', 'moderate:content'],
  compliance: ['read:self', 'read:org', 'read:audit', 'read:users'],
  finance:    ['read:self', 'read:org', 'manage:billing', 'read:analytics'],
};

function err(status, code, message) {
  const e = new Error(message || code);
  e.name = 'AuthError';
  e.status = status;
  e.statusCode = status;
  e.code = code;
  return e;
}

function roleLevel(role) {
  const direct = ROLE_HIERARCHY.indexOf(role);
  if (direct !== -1) return direct;
  // Functional role → the tier it is equivalent to. Still -1 for genuinely unknown roles,
  // so an unrecognised value can never accidentally acquire authority.
  const tier = FUNCTIONAL_ROLE_TIER[role];
  return tier ? ROLE_HIERARCHY.indexOf(tier) : -1;
}

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

/**
 * EXACT-match role guard — deliberately NON-hierarchical.
 *
 * requireRole() is hierarchical, so requireRole('admin') also admits `owner` and `super_admin`.
 * That is wrong wherever a higher tier is not actually more trusted. `owner` is SELF-SERVICE:
 * registration creates an organization and makes the registrant its owner, so every signed-up
 * user holds it. Gating a platform surface on requireRole('admin') therefore hands it to the
 * entire public — verified 2026-09-05, when a freshly registered account could read the
 * platform user list.
 *
 * Use this for platform-staff surfaces; use requireRole() for genuine org hierarchies.
 */
function requireExactRole(...roles) {
  return (req, _res, next) => {
    if (!req.auth) return next(err(401, 'unauthorized', 'Authentication required'));
    const userRoles = authRoles(req);
    if (!userRoles.some((r) => roles.includes(r))) {
      return next(err(403, 'forbidden', `Requires role: ${roles.join(' or ')}`));
    }
    return next();
  };
}

/** Platform-staff tier for admin-service surfaces: real staff only, never a self-service owner. */
const requireStaffAdmin = requireExactRole('admin', 'super_admin');

const requireSuperAdmin = requireRole('super_admin');
const requireOrgAdmin = requireRole('admin', 'owner', 'super_admin');

/**
 * Express guard for platform operations — evaluated INDEPENDENTLY of the org hierarchy.
 * A tenant role (no matter how high, including super_admin) never satisfies this; the caller
 * must explicitly hold one of the named platform roles.
 */
function requirePlatformRole(...roles) {
  const required = roles.length ? roles : PLATFORM_ROLES;
  return (req, _res, next) => {
    if (!req.auth) return next(err(401, 'unauthorized', 'Authentication required'));
    const userRoles = authRoles(req);
    if (!userRoles.some((r) => required.includes(r))) {
      return next(err(403, 'forbidden', `Requires platform role: ${required.join(' or ')}`));
    }
    return next();
  };
}

module.exports = {
  ROLE_HIERARCHY, ROLE_PERMISSIONS, FUNCTIONAL_ROLE_TIER,
  PLATFORM_ROLES, PLATFORM_BYPASS_ROLES,
  roleLevel, isRoleAtLeast, hasPermission,
  isPlatformRole, hasTenantBypass, assertNoRoleConfusion,
  requireRole, requireExactRole, requireStaffAdmin, requirePermission, requireSuperAdmin, requireOrgAdmin, requirePlatformRole,
};
