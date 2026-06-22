'use strict';

/**
 * Consumer social login endpoints (public — the auth entry point):
 *   GET /v1/auth/oauth/:provider/start     → set tx cookie, redirect to provider
 *   GET /v1/auth/oauth/:provider/callback  → verify state, exchange code, find-or-create, log in
 *
 * On success: set the refresh cookie (same as password login) and redirect the browser
 * back into the site (the SPA restores the session via the cookie on load). On failure:
 * redirect to the site with ?oauth_error=<code>. Amarisé reaches this directly via its
 * /auth-bff/* rewrite to auth-service /v1/auth/*.
 */

const crypto = require('crypto');
const oauth = require('../service/oauthLogin');
const config = require('../config/appConfig');
const logger = require('../utils/logger');

const APP_URL = String(config.oauth.appUrl || '').replace(/\/$/, '');
const TX_COOKIE = 'oauth_tx';
const REFRESH_COOKIE = config.refreshCookieName;

// Only allow same-origin relative return paths (no open redirect).
const safePath = (p) => (typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') ? p : '/');

function setRefresh(res, token) {
  res.cookie(REFRESH_COOKIE, token, { httpOnly: true, secure: config.env === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
}

const txOpts = () => ({ httpOnly: true, secure: config.env === 'production', sameSite: 'lax', maxAge: config.oauth.stateTtlMs, path: '/' });

const CLIENT_ERROR_CODES = new Set([
  'unsupported_provider', 'provider_not_configured', 'provider_denied', 'invalid_state',
  'state_mismatch', 'missing_code', 'start_failed', 'oauth_email_unverified',
  'oauth_no_email', 'oauth_no_id', 'account_disabled', 'org_suspended', 'mfa_required',
]);

function fail(res, returnTo, code) {
  const safe = CLIENT_ERROR_CODES.has(code) ? code : 'login_failed';
  const path = safePath(returnTo);
  const sep = path.includes('?') ? '&' : '?';
  res.redirect(`${APP_URL}${path}${sep}oauth_error=${encodeURIComponent(safe)}`);
}

// Success → back to the (public) return page with an `oauth=ok` marker. The refresh
// cookie is set; the page forwards to the member area, which restores the session once
// (avoids a double /refresh that would trip refresh-token rotation/reuse detection).
function succeed(res, returnTo) {
  const path = safePath(returnTo);
  const sep = path.includes('?') ? '&' : '?';
  res.redirect(`${APP_URL}${path}${sep}oauth=ok`);
}

module.exports = {
  start: async (req, res) => {
    const returnTo = safePath(req.query.returnTo);
    try {
      const provider = String(req.params.provider || '').toLowerCase();
      if (!oauth.isSupportedProvider(provider)) return fail(res, returnTo, 'unsupported_provider');
      if (!(await oauth.isConfigured(provider))) return fail(res, returnTo, 'provider_not_configured');

      const nonce = crypto.randomBytes(24).toString('hex');
      const pkce = oauth.createPkce();
      res.cookie(TX_COOKIE, oauth.encodeTx({ nonce, provider, verifier: pkce.verifier, returnTo }), txOpts());
      return res.redirect(await oauth.authorizeUrl(provider, { state: nonce, codeChallenge: pkce.challenge }));
    } catch (e) {
      logger.error('[oauth] start: ' + (e && e.message));
      return fail(res, returnTo, 'start_failed');
    }
  },

  callback: async (req, res) => {
    let returnTo = '/';
    try {
      const provider = String(req.params.provider || '').toLowerCase();
      if (!oauth.isSupportedProvider(provider)) return fail(res, returnTo, 'unsupported_provider');

      const tx = oauth.decodeTx(req.cookies && req.cookies[TX_COOKIE]);
      res.clearCookie(TX_COOKIE, { path: '/' });
      if (tx && tx.returnTo) returnTo = safePath(tx.returnTo);

      if (req.query.error) return fail(res, returnTo, 'provider_denied');
      if (!tx || tx.provider !== provider) return fail(res, returnTo, 'invalid_state');
      if (!req.query.state || req.query.state !== tx.nonce) return fail(res, returnTo, 'state_mismatch');
      if (!req.query.code) return fail(res, returnTo, 'missing_code');

      const ctx = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
      const profile = await oauth.exchangeAndFetchProfile(provider, { code: req.query.code, codeVerifier: tx.verifier });
      const result = await oauth.loginWithProfile(profile, ctx);
      setRefresh(res, result.refreshToken);
      return succeed(res, returnTo);
    } catch (e) {
      logger.error('[oauth] callback: ' + (e && e.message));
      const code = e && e.code ? String(e.code).toLowerCase() : 'login_failed';
      return fail(res, returnTo, code);
    }
  },
};
