// Shared Baalvion auth surface (auth.baalvion.com). The public "Sign in" delegates here; it returns
// to this site themed as the "about" brand. Base configured via NEXT_PUBLIC_AUTH_URL.
//
// Read NEXT_PUBLIC_AUTH_URL directly (Next inlines NEXT_PUBLIC_* at build time). Do NOT import ./env
// here: that module runs server-side env validation (ADMIN_SECRET_KEY) at import time, and this file
// is pulled into the client navbar — which would drag that validation into every prerendered page and
// break `next build` (ADMIN_SECRET_KEY isn't present at build).
const BRAND = 'about';

export const SHARED_AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.baalvion.com';

/** Build the sign-in URL into the shared auth surface, themed for this brand, returning here after. */
export function sharedSignInUrl(): string {
  const url = new URL(SHARED_AUTH_URL);
  url.searchParams.set('brand', BRAND);
  if (typeof window !== 'undefined') url.searchParams.set('return_to', window.location.origin);
  return url.toString();
}
