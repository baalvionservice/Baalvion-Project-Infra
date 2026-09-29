// Shared Baalvion auth surface (auth.baalvion.com). The primary "Login" delegates here; the legacy
// /auth/login route stays reachable as a fallback. Brand-Connector is on the .baalvion.com apex, so
// the shared refresh cookie carries the SSO session.
//
// NOTE: this app already uses NEXT_PUBLIC_AUTH_URL for its own auth BFF base (=/auth-bff, see
// lib/api-client.ts), so the shared sign-in surface is configured separately via
// NEXT_PUBLIC_SHARED_AUTH_URL to avoid collision.
const SHARED_AUTH_URL = process.env.NEXT_PUBLIC_SHARED_AUTH_URL || 'https://auth.baalvion.com';
const BRAND = 'brand-connector';

/** Build the sign-in URL into the shared auth surface, themed for this brand, returning here after. */
export function sharedSignInUrl(): string {
  const url = new URL(SHARED_AUTH_URL);
  url.searchParams.set('brand', BRAND);
  if (typeof window !== 'undefined') url.searchParams.set('return_to', window.location.origin);
  return url.toString();
}
