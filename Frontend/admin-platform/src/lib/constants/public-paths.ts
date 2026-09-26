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
export const PUBLIC_PATHS = ['/login', '/mfa', '/forgot-password', '/reset-password'] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
