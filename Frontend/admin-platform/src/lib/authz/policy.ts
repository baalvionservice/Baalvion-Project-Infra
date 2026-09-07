/**
 * Route access policy — the console's map of "who may open what".
 *
 * Seeded from the `roles: [...]` declarations already in lib/constants/navigation.ts, so no
 * section becomes harder to reach than the sidebar already implied. Two deliberate differences:
 *
 *  1. Requirements are HIERARCHICAL, matching auth-node's requireRole(). The nav listed
 *     ['super_admin','admin'] in places, silently excluding `owner` — but the backend allows
 *     owner (level 5 > admin's 4), so the sidebar was hiding a section the API would serve.
 *     minRole:'admin' is what the server actually enforces.
 *  2. Permission clauses use ONLY keys the backend really issues (auth-node ROLE_PERMISSIONS
 *     and rbac-service's seeded keys). Nothing invented.
 *
 * Matching is LONGEST-PREFIX, so a child route can be opened up relative to its parent —
 * /settings needs admin, but /settings/profile is your own profile and must stay reachable.
 */
import type { AccessRequirement } from './access';

export interface RoutePolicy extends AccessRequirement {
  /** Path prefix this rule governs. */
  path: string;
}

/** Ordered by specificity at lookup time, not here — declaration order is for humans. */
export const ROUTE_POLICIES: RoutePolicy[] = [
  // ── Open to any signed-in staff member ────────────────────────────────────────
  { path: '/dashboard', label: 'Signed-in staff' },
  { path: '/analytics', label: 'Signed-in staff' },
  { path: '/welcome', label: 'Signed-in staff' },
  // Your own profile — never gated behind the /settings admin rule below.
  { path: '/settings/profile', label: 'Your own profile' },

  // ── Content & editorial: the CMS enforces per-website membership itself ───────
  // (cms-service gates every route with requireCmsRole; a blanket console gate here
  //  would lock out exactly the writers the CMS is designed to admit.)
  { path: '/cms', label: 'Signed-in staff' },
  { path: '/media', label: 'Signed-in staff' },
  { path: '/imperialpedia', label: 'Signed-in staff' },
  { path: '/news-intelligence', label: 'Signed-in staff' },
  { path: '/law', label: 'Signed-in staff' },
  { path: '/notifications', label: 'Signed-in staff' },

  // Verticals that also ship as their own deployment but keep an in-console admin page.
  { path: '/jobs', label: 'Signed-in staff' },
  { path: '/ctm', label: 'Signed-in staff' },

  // ── Commerce ──────────────────────────────────────────────────────────────────
  { path: '/commerce', label: 'Signed-in staff' },
  { path: '/commerce/revenue', minRole: 'admin', label: 'Administrators' },

  // ── Identity & access ─────────────────────────────────────────────────────────
  // No anyPermission clauses below: these are admin-service sections, and its gate is
  // requireRole('admin'), which honours no permission claim. Offering a permission route
  // in would promise access the server refuses.
  { path: '/identity', minRole: 'admin', label: 'Administrators' },
  { path: '/users', minRole: 'admin', label: 'Administrators' },
  { path: '/organizations', minRole: 'admin', label: 'Administrators' },
  { path: '/sessions', minRole: 'admin', label: 'Administrators' },
  { path: '/oauth', minRole: 'admin', anyPermission: ['manage:api_keys'], label: 'Administrators' },
  { path: '/rbac', minRole: 'super_admin', anyPermission: ['role:assign'], label: 'Platform administrators' },

  // ── Security & audit ──────────────────────────────────────────────────────────
  { path: '/security', minRole: 'admin', anyPlatformRole: ['platform_security_admin'], label: 'Administrators and platform security' },
  { path: '/audit-logs', minRole: 'admin', anyPlatformRole: ['platform_security_admin'], label: 'Administrators and platform security' },
  { path: '/audit-center', minRole: 'admin', anyPlatformRole: ['platform_security_admin'], label: 'Administrators and platform security' },

  // ── Money ─────────────────────────────────────────────────────────────────────
  { path: '/payments', minRole: 'admin', label: 'Administrators' },
  { path: '/billing', minRole: 'admin', label: 'Administrators' },
  { path: '/revenue', minRole: 'admin', label: 'Administrators' },

  // ── Business operations ───────────────────────────────────────────────────────
  { path: '/crm', minRole: 'manager', label: 'Managers and above' },
  { path: '/ir', minRole: 'admin', label: 'Administrators' },
  { path: '/marketplace', minRole: 'admin', label: 'Administrators' },
  { path: '/staff', minRole: 'admin', label: 'Administrators' },
  // Joins the staff directory with CMS access — reveals more than either alone.
  { path: '/people', minRole: 'admin', label: 'Administrators' },
  { path: '/support', minRole: 'admin', anyPlatformRole: ['platform_support_admin'], label: 'Administrators and platform support' },
  { path: '/operations', minRole: 'admin', label: 'Administrators' },
  { path: '/platform-management', minRole: 'admin', label: 'Administrators' },

  // ── Engineering ───────────────────────────────────────────────────────────────
  { path: '/ai', minRole: 'admin', label: 'Administrators' },
  { path: '/developers', minRole: 'admin', label: 'Administrators' },
  { path: '/infrastructure', minRole: 'admin', anyPlatformRole: ['platform_admin'], label: 'Administrators' },
  { path: '/feature-flags', minRole: 'admin', label: 'Administrators' },

  // ── Console configuration ─────────────────────────────────────────────────────
  { path: '/settings', minRole: 'admin', label: 'Administrators' },
];

// Longest prefix wins, so /settings/profile beats /settings.
const BY_SPECIFICITY = [...ROUTE_POLICIES].sort((a, b) => b.path.length - a.path.length);

const isPrefixOf = (prefix: string, pathname: string): boolean =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

/**
 * The rule governing `pathname`, or null when no rule covers it.
 *
 * A null result means the route is UNGOVERNED, not "public" — callers decide. AccessGate
 * treats it as signed-in-only and reports it, so a newly added section can never slip in
 * silently ungated.
 */
export function policyFor(pathname: string): RoutePolicy | null {
  return BY_SPECIFICITY.find((p) => isPrefixOf(p.path, pathname)) ?? null;
}

/** Top-level segments that exist as routes but have no policy — a build-time safety net. */
export function ungovernedSegments(segments: string[]): string[] {
  return segments.filter((s) => !policyFor(`/${s}`));
}
