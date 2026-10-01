/**
 * The console's unauthenticated pages — the one list, shared by everything that asks
 * "is this the login screen?".
 *
 * It previously lived in three places (middleware.ts, AuthProvider.tsx, api/client.ts), each
 * testing `pathname.startsWith('/login')`. That also matched /login-activity: middleware
 * bounced signed-in admins to /dashboard, and AuthProvider skipped the session bootstrap
 * entirely, so the page rendered "You don't have access" to a super_admin. Any future route
 * merely prefixed by a public one would have broken the same way.
 *
 * Matching is on SEGMENT boundaries, so /reset-password/<token> is still public while
 * /reset-password-history would not be.
 */
export const PUBLIC_PATHS = ['/login', '/mfa', '/forgot-password', '/reset-password', '/invite'] as const;

// Public pages that stay reachable while signed in: an invitee who already has an account
// may open their link with a live session and must still be able to accept it.
const OPEN_WHEN_SIGNED_IN = ['/invite'] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Public pages that signed-in users are bounced away from (login, MFA, password reset). */
export function isGuestOnlyPath(pathname: string): boolean {
  if (!isPublicPath(pathname)) return false;
  return !OPEN_WHEN_SIGNED_IN.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
