// Social login (Google / GitHub) kickoff.
//
// This is a FULL-PAGE navigation (not fetch): the browser must follow the provider
// redirect and carry the httpOnly tx/refresh cookies same-origin. The backend
// (proxy-service, reached via the /auth-bff reverse proxy) handles the code exchange
// and redirects back to /auth/sso-callback with the session tokens, which SsoCallback
// then consumes. On failure it redirects to /login?oauth_error=<code>.
const BASE = "/auth-bff";

export type OAuthProvider = "google" | "github";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  provider_not_configured: "Social login is not configured yet. Please use email and password.",
  unsupported_provider: "That sign-in provider is not supported.",
  provider_denied: "Sign-in was cancelled.",
  state_mismatch: "Your sign-in session expired. Please try again.",
  invalid_state: "Your sign-in session expired. Please try again.",
  missing_code: "The provider did not return an authorization code. Please try again.",
  oauth_email_unverified: "Your email with that provider is not verified. Verify it, then try again.",
  oauth_no_email: "That provider did not share an email address. Please use email and password.",
  account_disabled: "Your account is not active. Contact support.",
  user_exists: "An account with this email already exists. Sign in with your password.",
};

export function oauthErrorMessage(code: string | null): string {
  if (!code) return "Social sign-in failed. Please try again.";
  return OAUTH_ERROR_MESSAGES[code.toLowerCase()] || "Social sign-in failed. Please try again.";
}

export function startOAuthLogin(provider: OAuthProvider): void {
  window.location.assign(`${BASE}/oauth/${provider}/start`);
}
