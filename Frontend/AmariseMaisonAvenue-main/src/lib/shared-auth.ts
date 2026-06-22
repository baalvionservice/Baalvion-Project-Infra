// Shared Baalvion auth surface (auth.baalvion.com). The primary "Sign in" control delegates here;
// the existing /account/login + /account/register routes stay reachable as a fallback. Amarisé is
// CROSS-APEX (amarisemaisonavenue.com), so the shared .baalvion.com refresh cookie does NOT reach it —
// the session arrives via the #token hash on /auth/sso-callback (see that page for the caveat).
// Base via NEXT_PUBLIC_SHARED_AUTH_URL (kept distinct from the existing /auth-bff base).
const SHARED_AUTH_URL = process.env.NEXT_PUBLIC_SHARED_AUTH_URL || 'https://auth.baalvion.com';
const BRAND = 'amarise';

/** Build the sign-in URL into the shared auth surface, themed for this brand, returning here after. */
export function sharedSignInUrl(): string {
  const url = new URL(SHARED_AUTH_URL);
  url.searchParams.set('brand', BRAND);
  if (typeof window !== 'undefined') url.searchParams.set('return_to', window.location.origin);
  return url.toString();
}
