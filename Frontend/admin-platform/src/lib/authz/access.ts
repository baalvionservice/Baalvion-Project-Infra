/**
 * The console's single authorization entry point.
 *
 * Mirrors auth-node's hasPermission()/requireRole() so a UI decision and the API decision
 * behind it agree. Resolution order is deliberately BACKEND-TRUTH-FIRST:
 *
 *   1. super_admin, or a `*` permission claim  → allow (matches server-side short-circuit)
 *   2. an explicit permission in the token's permissions[] → allow
 *   3. a permission implied by one of the caller's hierarchy roles → allow
 *   4. otherwise → deny, with the reason the UI should explain
 *
 * The token's permissions[] is the authoritative grant. Roles are only a fallback for
 * principals whose token predates permission claims.
 */
import {
  ROLE_PERMISSIONS,
  FUNCTIONAL_ROLE_PERMISSIONS,
  isHierarchyRole,
  isRoleAtLeast,
  maxRoleLevel,
  isPlatformRole,
  roleLevel,
} from './hierarchy';

export type DenyReason =
  | 'unauthenticated' // no session at all
  | 'role' // authenticated, but role is too low
  | 'permission' // authenticated, but lacks the required permission claim
  | 'unmapped-role'; // holds only a role the backend hierarchy does not know

export interface AccessDecision {
  allowed: boolean;
  reason?: DenyReason;
  /** What was required, for the denial screen — never a raw claim dump. */
  required?: string;
}

export interface Principal {
  roles: string[];
  permissions: string[];
}

const ALLOW: AccessDecision = { allowed: true };

/**
 * Wildcard-aware claim match. `*` grants everything; `user:*` grants `user:read`.
 * Both permission vocabularies in use are supported — auth-node's action:scope
 * (`manage:org`) and rbac-service's resource:action (`user:read`).
 */
export function permissionMatches(held: string, required: string): boolean {
  if (held === '*' || held === required) return true;
  if (!held.endsWith(':*')) return false;
  return required.startsWith(held.slice(0, -1));
}

/** True when the principal holds `permission` — explicitly or via a role's implied set. */
export function hasPermission(principal: Principal, permission: string): boolean {
  const { roles, permissions } = principal;
  if (roles.includes('super_admin')) return true;
  if (permissions.some((p) => permissionMatches(p, permission))) return true;

  return roles.some((r) => {
    const implied = isHierarchyRole(r) ? ROLE_PERMISSIONS[r] : FUNCTIONAL_ROLE_PERMISSIONS[r];
    return implied?.some((p) => permissionMatches(p, permission)) ?? false;
  });
}

/** What a route or action demands. Any single satisfied clause grants access. */
export interface AccessRequirement {
  /** Caller's highest hierarchy role must reach this (e.g. 'admin'). */
  minRole?: string;
  /** Holding ANY of these permissions grants access. */
  anyPermission?: string[];
  /** Holding ANY of these exact platform roles grants access (separate dimension). */
  anyPlatformRole?: string[];
  /** Human-readable summary shown on the denial screen. */
  label?: string;
}

/** Evaluate a requirement against a principal. */
export function evaluate(
  principal: Principal | null,
  requirement: AccessRequirement,
): AccessDecision {
  if (!principal) return { allowed: false, reason: 'unauthenticated' };

  const { roles } = principal;
  if (roles.includes('super_admin')) return ALLOW;

  if (requirement.anyPlatformRole?.some((r) => roles.includes(r))) return ALLOW;
  if (requirement.anyPermission?.some((p) => hasPermission(principal, p))) return ALLOW;
  if (requirement.minRole && isRoleAtLeast(roles, requirement.minRole)) return ALLOW;

  // An empty requirement means "any authenticated user".
  if (!requirement.minRole && !requirement.anyPermission && !requirement.anyPlatformRole) {
    return ALLOW;
  }

  // Distinguish "your role is too low" from "your role isn't wired up at all" — the second
  // is our configuration bug, not the user's, and the denial screen says so.
  // roleLevel resolves functional roles (finance, compliance, …) to their tier, so only a role
  // nothing recognises scores -1. Checking isHierarchyRole alone would wrongly tell a finance
  // user their account is misconfigured.
  const hasAnyKnownRole = roles.some((r) => roleLevel(r) >= 0 || isPlatformRole(r));
  const reason: DenyReason = !hasAnyKnownRole && roles.length > 0 ? 'unmapped-role' : 'role';

  return {
    allowed: false,
    reason: requirement.anyPermission && !requirement.minRole ? 'permission' : reason,
    required: requirement.label,
  };
}

export { maxRoleLevel };
