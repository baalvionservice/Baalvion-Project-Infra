/**
 * Faithful mirror of the enforcing authority: Backend/packages/auth-node/rbac.js.
 *
 * The console previously carried its own invented role matrix (lib/constants/permissions.ts),
 * which no backend ever consulted — so the UI and the API disagreed about who could do what.
 * Everything here is a 1:1 port of the guards that actually run server-side, so a screen the
 * console shows is a screen whose API calls will succeed.
 *
 * KEEP IN SYNC with auth-node/rbac.js. If the hierarchy changes there, change it here.
 */

/** Org-membership hierarchy, lowest → highest. Index IS the level. */
export const ROLE_HIERARCHY = [
  'viewer',
  'member',
  'editor',
  'manager',
  'admin',
  'owner',
  'super_admin',
] as const;

export type HierarchyRole = (typeof ROLE_HIERARCHY)[number];

/**
 * Platform operator roles — a SEPARATE dimension from the org hierarchy above.
 * A tenant role never satisfies a platform check, however high it is (requirePlatformRole).
 */
export const PLATFORM_ROLES = [
  'platform_admin',
  'platform_security_admin',
  'platform_support_admin',
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/** Only these bypass tenant (RLS) isolation. platform_support_admin deliberately does not. */
export const PLATFORM_BYPASS_ROLES: readonly PlatformRole[] = [
  'platform_admin',
  'platform_security_admin',
];

/** Implicit permissions each hierarchy role carries, per auth-node ROLE_PERMISSIONS. */
/**
 * Functional roles mapped onto a hierarchy tier — mirrors auth-node's FUNCTIONAL_ROLE_TIER.
 * These used to score -1 and fail every check while the console still offered their screens.
 * Mapped rather than spliced into ROLE_HIERARCHY, whose index IS the level.
 */
export const FUNCTIONAL_ROLE_TIER: Record<string, HierarchyRole> = {
  readonly: 'viewer',
  support: 'member',
  analyst: 'member',
  developer: 'editor',
  moderator: 'editor',
  compliance: 'manager',
  finance: 'manager',
};

export const FUNCTIONAL_ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  readonly: ['read:self', 'read:org'],
  support: ['read:self', 'read:org', 'read:users'],
  analyst: ['read:self', 'read:org', 'read:analytics'],
  developer: ['read:self', 'read:org', 'write:self', 'manage:api_keys'],
  moderator: ['read:self', 'read:org', 'write:self', 'write:org', 'moderate:content'],
  compliance: ['read:self', 'read:org', 'read:audit', 'read:users'],
  finance: ['read:self', 'read:org', 'manage:billing', 'read:analytics'],
};

export const ROLE_PERMISSIONS: Record<HierarchyRole, readonly string[]> = {
  viewer: ['read:self'],
  member: ['read:self', 'read:org', 'write:self'],
  editor: ['read:self', 'read:org', 'write:self', 'write:org'],
  manager: ['read:self', 'read:org', 'write:self', 'write:org', 'manage:members'],
  admin: ['read:self', 'read:org', 'write:self', 'write:org', 'manage:members', 'manage:org', 'manage:api_keys'],
  owner: ['read:self', 'read:org', 'write:self', 'write:org', 'manage:members', 'manage:org', 'manage:api_keys', 'manage:billing', 'delete:org'],
  super_admin: ['*'],
};

export const isHierarchyRole = (role: string): role is HierarchyRole =>
  (ROLE_HIERARCHY as readonly string[]).includes(role);

export const isPlatformRole = (role: string): role is PlatformRole =>
  (PLATFORM_ROLES as readonly string[]).includes(role);

/**
 * Level of a single role. Functional roles resolve to their equivalent tier; anything genuinely
 * unknown stays -1 so it can never accidentally acquire authority. Mirrors auth-node roleLevel.
 */
export const roleLevel = (role: string): number => {
  const direct = (ROLE_HIERARCHY as readonly string[]).indexOf(role);
  if (direct !== -1) return direct;
  const tier = FUNCTIONAL_ROLE_TIER[role];
  return tier ? (ROLE_HIERARCHY as readonly string[]).indexOf(tier) : -1;
};

/** Highest level across a caller's roles. -1 when none are hierarchy roles. */
export const maxRoleLevel = (roles: readonly string[]): number =>
  roles.reduce((max, r) => Math.max(max, roleLevel(r)), -1);

/** True when the caller's HIGHEST role meets `required` — hierarchical, as server-side. */
export const isRoleAtLeast = (roles: readonly string[], required: string): boolean =>
  maxRoleLevel(roles) >= roleLevel(required);

export const hasTenantBypass = (roles: readonly string[]): boolean =>
  roles.some((r) => (PLATFORM_BYPASS_ROLES as readonly string[]).includes(r));

/**
 * Roles the console offers but the backend hierarchy has never heard of. roleLevel() returns
 * -1 for each, so a user holding ONLY one of these fails every requireRole guard — the console
 * would show them screens whose every API call 403s. Surfaced in the RBAC screens rather than
 * silently tolerated, and deliberately NOT deleted from lib/constants/roles.ts.
 */
// RESOLVED 2026-09-05: all seven now map to a tier via FUNCTIONAL_ROLE_TIER above. The list is
// kept so `isUnmappedConsoleRole` stays available, and now reports false for every entry — the
// denial screen's "your account needs setup" path only fires for a genuinely unknown role.
export const LEGACY_UNMAPPED_CONSOLE_ROLES = [
  'support',
  'developer',
  'analyst',
  'finance',
  'compliance',
  'moderator',
  'readonly',
] as const;

export const UNMAPPED_CONSOLE_ROLES = LEGACY_UNMAPPED_CONSOLE_ROLES;

/** True only for a role no part of the system knows — now that the seven are mapped. */
export const isUnmappedConsoleRole = (role: string): boolean => roleLevel(role) === -1;
