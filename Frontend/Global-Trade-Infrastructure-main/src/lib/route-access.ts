/**
 * @file route-access.ts
 * @description SINGLE SOURCE OF TRUTH for route-level access classification.
 *
 * Imported by BOTH the edge middleware (the cookie-presence authentication gate) and the client
 * `RouteGuard` (per-persona authorization). Keeping the prefix lists here means the two layers can
 * never drift — a route added to the authenticated surface is gated everywhere at once.
 *
 * Two tiers:
 *   • AUTH_REQUIRED_PREFIXES — needs a valid session (any authenticated authority).
 *   • ADMIN_PREFIXES         — governance / sovereign-command surfaces. The edge still only checks
 *                              that a session exists; the SPECIFIC authority is enforced by the
 *                              RouteGuard (persona allowlist) + the API (authoritative).
 *
 * `PUBLIC_EXACT` below is NOT currently consumed by `middleware.ts` — the edge gate is default-allow
 * (anything not matched by `isAdminPath`/`needsAuth` is already public). It's kept as accurate,
 * forward-looking documentation of the intended public surface for a future default-deny migration;
 * don't assume it's an active allowlist today.
 */

export const AUTH_REQUIRED_PREFIXES: readonly string[] = [
  '/dashboard',
  '/buyer',
  '/seller',
  '/agent', // singular: /agent/dashboard, /agent/requests (was previously unguarded — only /agents existed)
  '/agents',
  '/marketplace',
  '/deals',
  '/orders',
  '/logistics-shipment',
  '/payments',
  '/finance-settlement',
  '/escrow',
  '/financials',
  '/compliance',
  '/compliance-regulatory', // distinct prefix — '/compliance' does NOT match '/compliance-regulatory'
  '/sanctions-screening',
  '/documents',
  '/messages',
  '/profile',
  '/insurance',
  '/intelligence-hub',
  '/negotiations',
  '/discovery',
  '/collaboration',
  '/executive',
  '/crisis-center',
  '/customs',
  '/sourcing',
  '/shipments',
  '/sailing-schedules', // carrier sailing schedules: lane search, port board, vessel tracking
  '/carriers',
  '/field',
  '/suppliers',
  '/trade-management',
  '/trade-ops', // Trade Operations control center (shipment-centric TradeOps Cloud surface)
  '/settings',
  '/verify-phone',           // post-signup phone OTP — needs the just-established session
  '/platform/organizations', // platform console — requires auth
  '/organization',           // org self-administration (/organization/settings, /users, /audit)
];

export const ADMIN_PREFIXES: readonly string[] = [
  '/governance',
  '/oversight',
  // Sovereign "supreme command" surfaces — authenticated + persona-gated (only god-view '*'
  // personas are allowed by the RouteGuard). Left public previously.
  '/singularity-command',
  '/infinity-command',
  '/eternal-command',
  '/quantum-command',
  '/continuity-command',
  '/ascension-command',
  '/absolute-infinity-command',
  '/godsystem-command',
  '/eternal-absolute-command',
];

/** Exact-match public routes (marketing + auth entry). No session required. */
export const PUBLIC_EXACT: ReadonlySet<string> = new Set([
  '/',
  '/login',
  '/about',
  '/contact',
  '/pricing',
  '/privacy',
  '/terms',
  '/platform',
  '/platform/map',
  '/trust',
  '/banks',
  '/governments',
  '/enterprises',
  '/logistics',
  '/access/request',
  '/access/pending',
  '/onboard',
  '/onboard/buyer',
  '/onboard/seller',
  '/onboard/banking',
  '/onboard/customs',
  '/onboard/logistics',
  '/onboard/enterprise',
  '/onboard/government',
  '/countries',
  '/ports',
  '/tariffs',
  '/fta',
  '/authorities',
  '/compare',
  '/accept-invite',
  '/forgot-password',
  '/reset-password',
  '/register',
  '/verify-email',
]);

const matchesPrefix = (prefixes: readonly string[], pathname: string): boolean =>
  prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/** Governance / sovereign-command area. */
/**
 * The World Shipping Directory — a separate, wholly anonymous public property served on
 * its own subdomain (middleware.ts rewrites that host onto this prefix).
 *
 * Nothing under it has a session, so the client must not try to rehydrate one there. It
 * is not merely wasted work: `authApi.me()` answers 401 for an anonymous caller, which
 * surfaces as a console error on every page of a public reference site.
 */
export const SHIPPING_DIRECTORY_PREFIX = '/shipping-directory';

export function isAnonymousProperty(pathname: string): boolean {
  return pathname === SHIPPING_DIRECTORY_PREFIX || pathname.startsWith(`${SHIPPING_DIRECTORY_PREFIX}/`);
}

export function isAdminPath(pathname: string): boolean {
  return matchesPrefix(ADMIN_PREFIXES, pathname);
}

/** Authenticated (non-admin) operational area. */
export function needsAuth(pathname: string): boolean {
  return matchesPrefix(AUTH_REQUIRED_PREFIXES, pathname);
}

/** Any route requiring an authenticated, authorized session (auth OR admin). */
export function isProtectedPath(pathname: string): boolean {
  return isAdminPath(pathname) || needsAuth(pathname);
}
