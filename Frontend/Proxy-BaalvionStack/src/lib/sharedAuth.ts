// Shared Baalvion auth surface (auth.baalvion.com). The primary "Sign in" delegates here; the
// legacy /login route stays reachable as a fallback. Configure the base with VITE_AUTH_URL.
const ENV = import.meta.env as unknown as Record<string, string | undefined>;
const SHARED_AUTH_URL = ENV.VITE_AUTH_URL || 'https://auth.baalvion.com';
const BRAND = 'proxy';

/** Build the sign-in URL into the shared auth surface, themed for this brand, returning here after. */
export function sharedSignInUrl(): string {
  const url = new URL(SHARED_AUTH_URL);
  url.searchParams.set('brand', BRAND);
  if (typeof window !== 'undefined') url.searchParams.set('return_to', window.location.origin);
  return url.toString();
}
