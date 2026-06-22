'use strict';

/**
 * Consumer social login endpoints (public — they ARE the auth entry point):
 *   GET /v1/auth/oauth/:provider/start     → set tx cookie, redirect to provider
 *   GET /v1/auth/oauth/:provider/callback  → verify state, exchange code, find-or-create, log in
 *
 * On success a Baalvion session is minted (ssoService.completeLogin) and the SPA is
 * redirected to /auth/sso-callback with the tokens in the URL fragment (refresh also set
 * as an httpOnly cookie) — identical to the SAML/OIDC SSO flow the SPA already handles.
 * On any failure the browser is redirected to /login?oauth_error=<code>.
 */

const crypto = require('crypto');
const oauthService = require('../service/oauthService');
const sso = require('../service/ssoService');
const logger = require('../service/logger');
const config = require('../config/appConfig');

const APP_URL = config.oauth.appUrl;
const COOKIE = config.refreshCookieName;
const TX_COOKIE = 'oauth_tx';

function setRefresh(res, token) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'lax',
    maxAge: 7 * 864e5,
  });
}

function redirectWithTokens(res, result) {
  // The 7-day refresh token is delivered ONLY as the httpOnly cookie — never in the
  // URL fragment (which leaks via history/referrer/extensions). The SPA seeds its
  // in-memory access token from the fragment and silently refreshes via the cookie.
  setRefresh(res, result.refreshToken);
  const frag = `token=${encodeURIComponent(result.token)}`;
  res.redirect(`${APP_URL}/auth/sso-callback#${frag}`);
}

// Only surface a curated set of error codes to the browser — an unexpected exception's
// `.code` (e.g. a DB/driver/network code) must never leak into the URL.
const CLIENT_ERROR_CODES = new Set([
  'unsupported_provider', 'provider_not_configured', 'provider_denied',
  'invalid_state', 'state_mismatch', 'missing_code', 'start_failed',
  'oauth_email_unverified', 'oauth_no_email', 'oauth_no_id',
  'account_disabled', 'user_exists',
]);

function fail(res, code) {
  const safe = CLIENT_ERROR_CODES.has(code) ? code : 'login_failed';
  res.redirect(`${APP_URL}/login?oauth_error=${encodeURIComponent(safe)}`);
}

const txCookieOpts = () => ({
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: 'lax',
  maxAge: config.oauth.stateTtlMs,
  path: '/',
});

module.exports = {
  start: async (req, res) => {
    try {
      const provider = String(req.params.provider || '').toLowerCase();
      if (!oauthService.isSupportedProvider(provider)) return fail(res, 'unsupported_provider');
      if (!(await oauthService.isConfigured(provider))) return fail(res, 'provider_not_configured');

      // CSPRNG nonce — the sole CSRF guard for the redirect: it is echoed back via the
      // provider's `state` and compared against the httpOnly tx cookie on callback.
      const nonce = crypto.randomBytes(24).toString('hex');
      const pkce = oauthService.createPkce();
      const tx = oauthService.encodeTx({ nonce, provider, verifier: pkce.verifier });
      res.cookie(TX_COOKIE, tx, txCookieOpts());

      return res.redirect(await oauthService.authorizeUrl(provider, { state: nonce, codeChallenge: pkce.challenge }));
    } catch (e) {
      logger.error('[oauth] start:', e.message);
      return fail(res, 'start_failed');
    }
  },

  callback: async (req, res) => {
    try {
      const provider = String(req.params.provider || '').toLowerCase();
      if (!oauthService.isSupportedProvider(provider)) return fail(res, 'unsupported_provider');
      // The user declined consent (or the provider errored).
      if (req.query.error) return fail(res, 'provider_denied');

      const tx = oauthService.decodeTx(req.cookies && req.cookies[TX_COOKIE]);
      res.clearCookie(TX_COOKIE, { path: '/' });

      if (!tx || tx.provider !== provider) return fail(res, 'invalid_state');
      if (!req.query.state || req.query.state !== tx.nonce) return fail(res, 'state_mismatch');
      if (!req.query.code) return fail(res, 'missing_code');

      const ctx = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const profile = await oauthService.exchangeAndFetchProfile(provider, {
        code: req.query.code,
        codeVerifier: tx.verifier,
      });
      const { user, role } = await oauthService.findOrCreateUser(profile, ctx);
      const result = await sso.completeLogin({ user, role }, ctx);
      return redirectWithTokens(res, result);
    } catch (e) {
      logger.error('[oauth] callback:', e.message);
      const code = e && e.code ? String(e.code).toLowerCase() : 'login_failed';
      return fail(res, code);
    }
  },
};
