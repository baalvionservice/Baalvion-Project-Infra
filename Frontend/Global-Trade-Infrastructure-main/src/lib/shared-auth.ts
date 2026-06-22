// Shared Baalvion auth surface (auth.baalvion.com). The primary "Institutional Login" delegates
// here; the legacy /login + /register routes stay reachable as a fallback. GTI is on the
// .baalvion.com apex, so the shared refresh cookie carries the SSO session. Base via NEXT_PUBLIC_AUTH_URL.
const SHARED_AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.baalvion.com';
const BRAND = 'gti';

/** Build the sign-in URL into the shared auth surface, themed for this brand, returning here after. */
export function sharedSignInUrl(): string {
  const url = new URL(SHARED_AUTH_URL);
  url.searchParams.set('brand', BRAND);
  if (typeof window !== 'undefined') url.searchParams.set('return_to', window.location.origin);
  return url.toString();
}
