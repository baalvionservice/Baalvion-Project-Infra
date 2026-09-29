// Shared Baalvion auth surface (auth.baalvion.com). The primary "Sign In" control delegates
// here; the legacy /login route stays reachable as a fallback. Mining is on the .baalvion.com
// apex, so the shared refresh cookie carries the SSO session. Base via NEXT_PUBLIC_AUTH_URL.
const SHARED_AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.baalvion.com';
const BRAND = 'mining';

/** Build the sign-in URL into the shared auth surface, themed for this brand, returning here after. */
export function sharedSignInUrl(): string {
  const url = new URL(SHARED_AUTH_URL);
  url.searchParams.set('brand', BRAND);
  if (typeof window !== 'undefined') url.searchParams.set('return_to', window.location.origin);
  return url.toString();
}
