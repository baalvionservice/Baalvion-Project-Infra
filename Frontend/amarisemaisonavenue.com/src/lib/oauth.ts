'use client';

/**
 * Consumer social login (Google / Facebook) kickoff for Amarisé Maison Avenue.
 *
 * This is a FULL-PAGE navigation (not fetch): the browser must follow the provider
 * redirect and carry the httpOnly tx/refresh cookies same-origin. The backend
 * (auth-service, reached via the same-origin `/auth-bff` rewrite → `/v1/auth/oauth/*`)
 * handles the code exchange, sets the `baalvion_refresh` cookie, and redirects the
 * browser back to `<returnTo>?oauth=ok` (or `<returnTo>?oauth_error=<code>` on failure).
 * The returning public page then FORWARDS into the member area, which restores the
 * session exactly once (a second /refresh on the public page would trip refresh-token
 * reuse detection — see controller/oauthController.js).
 */

const BASE = '/auth-bff';

export type OAuthProvider = 'google' | 'facebook';

const ALL_PROVIDERS: readonly OAuthProvider[] = ['google', 'facebook'];

/**
 * Providers to surface, controlled per-deployment via NEXT_PUBLIC_OAUTH_PROVIDERS
 * (comma list, e.g. "google" to hide Facebook). Defaults to all supported providers.
 * An empty/blank value falls back to the default so a typo can't hide every button.
 */
export const ENABLED_OAUTH_PROVIDERS: readonly OAuthProvider[] = (() => {
  const raw = (process.env.NEXT_PUBLIC_OAUTH_PROVIDERS || '').trim();
  if (!raw) return ALL_PROVIDERS;
  const wanted = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is OAuthProvider => (ALL_PROVIDERS as readonly string[]).includes(s));
  return wanted.length ? wanted : ALL_PROVIDERS;
})();

export const OAUTH_PROVIDER_LABELS: Record<OAuthProvider, string> = {
  google: 'Google',
  facebook: 'Facebook',
};

// Error codes the backend may append as ?oauth_error=<code> (controller CLIENT_ERROR_CODES).
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  provider_not_configured: 'Social sign-in is not available yet. Please use your email and password.',
  unsupported_provider: 'That sign-in provider is not supported.',
  provider_denied: 'Sign-in was cancelled.',
  state_mismatch: 'Your sign-in session expired. Please try again.',
  invalid_state: 'Your sign-in session expired. Please try again.',
  missing_code: 'The provider did not return an authorization code. Please try again.',
  start_failed: 'We could not start social sign-in. Please try again.',
  oauth_email_unverified: 'Your email with that provider is not verified. Verify it, then try again.',
  oauth_no_email: 'That provider did not share an email address. Please use your email and password.',
  oauth_no_id: 'That provider did not return a usable profile. Please try again.',
  account_disabled: 'Your account is not active. Please contact our client services team.',
  org_suspended: 'Your account is not active. Please contact our client services team.',
  mfa_required: 'This account uses two-factor authentication. Please sign in with your email and password.',
};

export function oauthErrorMessage(code: string | null | undefined): string {
  if (!code) return 'Social sign-in failed. Please try again.';
  return OAUTH_ERROR_MESSAGES[code.toLowerCase()] || 'Social sign-in failed. Please try again.';
}

/** Only same-origin relative paths are allowed as a return target (no open redirect). */
function safeReturnTo(path: string): string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : '/';
}

/**
 * Begin the OAuth dance. `returnTo` is the same-origin path the provider flow lands
 * back on (an `?oauth=ok` / `?oauth_error=` marker is appended by the backend).
 */
export function startOAuthLogin(provider: OAuthProvider, returnTo: string): void {
  const url = `${BASE}/oauth/${provider}/start?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`;
  window.location.assign(url);
}
