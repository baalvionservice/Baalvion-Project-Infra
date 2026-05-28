'use strict';

/**
 * SSO endpoints (public — they ARE the auth entry). SAML SP-initiated + ACS +
 * metadata; OIDC login + callback. On success a Baalvion session is minted and
 * the SPA is redirected with tokens (refresh also set as an httpOnly cookie).
 */

const sso = require('../service/ssoService');
const metrics = require('../observability/enterpriseMetrics');
const logger = require('../service/logger');

const APP_URL = process.env.APP_URL || 'http://localhost:8080';
const COOKIE = process.env.REFRESH_COOKIE_NAME || 'baalvion_refresh';

function setRefresh(res, token) {
  res.cookie(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 864e5 });
}
function redirectWithTokens(res, result) {
  setRefresh(res, result.refreshToken);
  const frag = `token=${encodeURIComponent(result.token)}&refresh=${encodeURIComponent(result.refreshToken)}`;
  res.redirect(`${APP_URL}/auth/sso-callback#${frag}`);
}

module.exports = {
  samlMetadata: async (req, res) => {
    try { res.type('application/xml').send(await sso.samlMetadata(req.params.orgId)); }
    catch (e) { res.status(404).send(e.message); }
  },
  samlLogin: async (req, res) => {
    try { res.redirect(await sso.samlLoginUrl(req.params.orgId, req.query.relayState || '')); }
    catch (e) { res.status(400).json({ success: false, error: { message: e.message } }); }
  },
  samlAcs: async (req, res) => {
    try {
      const profile = await sso.handleSamlAcs(req.params.orgId, req.body);
      const result = await sso.completeLogin(profile, { ipAddress: req.ip, userAgent: req.headers['user-agent'] });
      metrics.incSsoLogin('saml');
      redirectWithTokens(res, result);
    } catch (e) { logger.error('[sso] saml acs:', e.message); res.redirect(`${APP_URL}/login?sso_error=1`); }
  },
  oidcLogin: async (req, res) => {
    try {
      const state = `${req.params.orgId}.${Math.random().toString(36).slice(2)}`;
      res.cookie('sso_state', state, { httpOnly: true, maxAge: 600000, sameSite: 'lax' });
      res.redirect(await sso.oidcAuthUrl(req.params.orgId, state));
    } catch (e) { res.status(400).json({ success: false, error: { message: e.message } }); }
  },
  oidcCallback: async (req, res) => {
    try {
      const profile = await sso.handleOidcCallback(req.params.orgId, req.query, req.cookies?.sso_state || req.query.state);
      const result = await sso.completeLogin(profile, { ipAddress: req.ip, userAgent: req.headers['user-agent'] });
      metrics.incSsoLogin('oidc');
      redirectWithTokens(res, result);
    } catch (e) { logger.error('[sso] oidc cb:', e.message); res.redirect(`${APP_URL}/login?sso_error=1`); }
  },
};
