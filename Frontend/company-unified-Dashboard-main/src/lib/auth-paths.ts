/**
 * Central auth-boundary route classification for the dashboard.
 *
 * Fail-closed: every route is PROTECTED unless its path matches an explicit public prefix.
 * This is the authoritative allow-list that <AuthGate> consults so an unauthenticated visitor
 * can never render an authenticated page shell — including via a dotted dynamic segment
 * (e.g. `/analytics/domains/example.com`) that the edge middleware matcher excludes as a
 * "static asset" (`.*\..*`). Keeping the decision here (not in middleware) means a new route
 * is gated by default the moment it ships, with no matcher to keep in sync.
 */

// Routes reachable WITHOUT a session. Anything not listed here is gated.
export const PUBLIC_PATH_PREFIXES = [
  "/auth", // login, signup, password reset — must be anonymous
  "/marketing", // public marketing pages
  "/install", // PWA install prompt
  "/docs", // public help / API docs
  "/onboarding", // post-signup profile completion (drives its own bootstrap)
  "/portal", // public partner/portal passthrough
] as const;

/** True when `pathname` is reachable without authentication. */
export function isPublicPath(pathname: string): boolean {
  // "/" is a redirect splash that itself routes anonymous users to /marketing.
  if (pathname === "/") return true;
  return PUBLIC_PATH_PREFIXES.some(
    // Exact match or a real sub-path — never a prefix-substring match, so "/authority"
    // is NOT treated as public just because it starts with "/auth".
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

/** True when `pathname` must be behind authentication (the fail-closed default). */
export function isProtectedPath(pathname: string): boolean {
  return !isPublicPath(pathname);
}
