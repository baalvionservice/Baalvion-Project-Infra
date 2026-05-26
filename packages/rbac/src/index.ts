import type { UserRole, AuthContext } from '@baalvion/types';
import { Errors } from '@baalvion/errors';
import type { Request, Response, NextFunction } from 'express';

// ─── Role hierarchy (higher index = more privileged) ─────────────────────────
const ROLE_HIERARCHY: UserRole[] = [
  'viewer',
  'member',
  'editor',
  'manager',
  'admin',
  'owner',
  'super_admin',
];

// ─── Default permissions per role ─────────────────────────────────────────────
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  viewer:      ['read:self'],
  member:      ['read:self', 'read:org', 'write:self'],
  editor:      ['read:self', 'read:org', 'write:self', 'write:org'],
  manager:     ['read:self', 'read:org', 'write:self', 'write:org', 'manage:members'],
  admin:       ['read:self', 'read:org', 'write:self', 'write:org', 'manage:members', 'manage:org', 'manage:api_keys'],
  owner:       ['read:self', 'read:org', 'write:self', 'write:org', 'manage:members', 'manage:org', 'manage:api_keys', 'manage:billing', 'delete:org'],
  super_admin: ['*'],
};

// ─── Core RBAC functions ──────────────────────────────────────────────────────

export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

export function isRoleAtLeast(userRole: UserRole, requiredRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

export function hasPermission(auth: AuthContext, permission: string): boolean {
  if (auth.role === 'super_admin') return true;
  if (auth.permissions.includes('*')) return true;
  if (auth.permissions.includes(permission)) return true;
  return ROLE_PERMISSIONS[auth.role]?.includes(permission) ?? false;
}

export function hasAnyPermission(auth: AuthContext, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(auth, p));
}

export function hasAllPermissions(auth: AuthContext, permissions: string[]): boolean {
  return permissions.every((p) => hasPermission(auth, p));
}

// ─── Express middleware guards ────────────────────────────────────────────────

/**
 * Requires the authenticated user to have at least the specified role.
 * Must be used AFTER authMiddleware.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const auth = req.auth;
    if (!auth) { next(Errors.unauthorized()); return; }

    const hasRole = roles.some((r) => isRoleAtLeast(auth.role, r));
    if (!hasRole) {
      next(Errors.forbidden(`Requires role: ${roles.join(' or ')}`));
      return;
    }
    next();
  };
}

/**
 * Requires the authenticated user to have the specified permission string.
 */
export function requirePermission(...permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const auth = req.auth;
    if (!auth) { next(Errors.unauthorized()); return; }

    const allowed = permissions.some((p) => hasPermission(auth, p));
    if (!allowed) {
      next(Errors.forbidden(`Requires permission: ${permissions.join(' or ')}`));
      return;
    }
    next();
  };
}

/**
 * Requires super_admin role — for platform-wide operations.
 */
export const requireSuperAdmin = requireRole('super_admin');

/**
 * Requires owner or admin role — for org management.
 */
export const requireOrgAdmin = requireRole('admin', 'owner', 'super_admin');

// ─── Exports ──────────────────────────────────────────────────────────────────
export { ROLE_HIERARCHY, ROLE_PERMISSIONS };
export type { UserRole };
