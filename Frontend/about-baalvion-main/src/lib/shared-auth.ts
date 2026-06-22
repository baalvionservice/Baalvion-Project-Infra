import { env } from './env';

// Shared Baalvion auth surface (auth.baalvion.com). The public "Sign in" delegates here; it returns
// to this site themed as the "about" brand. Base configured via NEXT_PUBLIC_AUTH_URL.
const BRAND = 'about';

export const SHARED_AUTH_URL = env.client.authUrl;

/** Build the sign-in URL into the shared auth surface, themed for this brand, returning here after. */
export function sharedSignInUrl(): string {
  const url = new URL(SHARED_AUTH_URL);
  url.searchParams.set('brand', BRAND);
  if (typeof window !== 'undefined') url.searchParams.set('return_to', window.location.origin);
  return url.toString();
}
