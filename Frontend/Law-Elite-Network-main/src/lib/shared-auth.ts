// Shared Baalvion auth surface (auth.baalvion.com). The primary "Sign In" delegates here; the legacy
// /login route stays reachable as a fallback. Law Elite Network is on its OWN apex
// (lawelitenetwork.com), so the shared .baalvion.com refresh cookie does NOT reach it — the SSO
// callback captures the access token from the URL hash instead (token-stash variant). Base via
// NEXT_PUBLIC_AUTH_URL.
const SHARED_AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.baalvion.com';
const BRAND = 'law';

/** Build the sign-in URL into the shared auth surface, themed for this brand, returning here after. */
export function sharedSignInUrl(): string {
  const url = new URL(SHARED_AUTH_URL);
  url.searchParams.set('brand', BRAND);
  if (typeof window !== 'undefined') url.searchParams.set('return_to', window.location.origin);
  return url.toString();
}
