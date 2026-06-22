// Social login (Google / Facebook) kickoff for Amarisé.
//
// Full-page navigation (not fetch): the browser follows the provider redirect and the
// httpOnly tx/refresh cookies flow same-origin. /auth-bff/* is rewritten to auth-service
// /v1/auth/*, which handles the exchange and redirects back to `returnTo` with either
// `?oauth=ok` (cookie set → forward into the account) or `?oauth_error=<code>`.
const BASE = '/auth-bff';

export type OAuthProvider = 'google' | 'facebook';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  provider_not_configured: 'Social login is not configured yet. Please use email and password.',
  unsupported_provider: 'That sign-in provider is not supported.',
  provider_denied: 'Sign-in was cancelled.',
  state_mismatch: 'Your sign-in session expired. Please try again.',
  invalid_state: 'Your sign-in session expired. Please try again.',
  missing_code: 'The provider did not return an authorization code. Please try again.',
  oauth_email_unverified: 'Your email with that provider is not verified. Verify it, then try again.',
  oauth_no_email: 'That provider did not share an email address. Please use email and password.',
  account_disabled: 'Your account is not active. Please contact support.',
  org_suspended: 'Your organisation is suspended. Please contact support.',
  mfa_required: 'This account uses two-factor authentication. Please sign in with your email and password.',
};

export function oauthErrorMessage(code: string | null): string {
  if (!code) return 'Social sign-in failed. Please try again.';
  return OAUTH_ERROR_MESSAGES[code.toLowerCase()] || 'Social sign-in failed. Please try again.';
}

export function startOAuthLogin(provider: OAuthProvider, returnTo: string): void {
  const qs = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
  window.location.assign(`${BASE}/oauth/${provider}/start${qs}`);
}
