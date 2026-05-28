'use strict';
// Auth gateway endpoints. The access token is NEVER returned in a body — only HttpOnly cookies.
// Login/refresh proxy to auth-service (RS256); the gateway manages cookies + CSRF + session binding.
const { Router } = require('express');
const config = require('../config/appConfig');
const verifier = require('../lib/verifier');
const { createSession, getSession, revoke, updateSession } = require('../lib/redisSession');
const { genToken, sha256 } = require('../lib/crypto');
const { detectGeo } = require('../lib/geoDetect');
const { requireSession } = require('../middleware/session');

const router = Router();

const clientIp = (req) => ((req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || (req.socket && req.socket.remoteAddress) || '';
const cookieOpts = (maxAgeSec, httpOnly = true) => ({ httpOnly, secure: config.cookie.secure, sameSite: config.cookie.sameSite, domain: config.cookie.domain, path: '/', maxAge: maxAgeSec * 1000 });
const decode = (t) => { try { return JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString()); } catch { return {}; } };

async function authService(path, body, cookieHeader) {
  const res = await fetch(`${config.authServiceUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookieHeader ? { cookie: cookieHeader } : {}) },
    body: JSON.stringify(body || {}),
  });
  let json = null; try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json };
}

// Create the Redis session (csrf + fingerprint + geo binding) and set all cookies. Returns the csrf token.
async function establish(req, res, accessToken, refreshToken) {
  const c = decode(accessToken);
  const csrfToken = genToken();
  const geo = detectGeo(req); // Phase 7 — record login-time country in session
  await createSession({
    sid: c.sid, userId: c.sub, orgId: c.org_id, roles: c.roles, exp: c.exp,
    csrfToken, uaHash: sha256(req.headers['user-agent']), ipHash: sha256(clientIp(req)),
    geo: { country: geo.country, source: geo.source },
  });
  res.cookie(config.cookie.accessName, accessToken, cookieOpts(config.cookie.accessMaxAge));
  if (refreshToken) res.cookie(config.cookie.refreshName, refreshToken, cookieOpts(config.cookie.refreshMaxAge));
  res.cookie(config.cookie.csrfName, csrfToken, cookieOpts(config.cookie.accessMaxAge, false)); // NON-HttpOnly → JS sends x-csrf-token
  return { c, csrfToken };
}

function clearCookies(res) {
  for (const n of [config.cookie.accessName, config.cookie.refreshName, config.cookie.csrfName]) {
    res.clearCookie(n, { path: '/', domain: config.cookie.domain });
  }
}

// POST /auth/login → auth-service RS256 → cookies + SAFE profile + csrf (NO access token in body).
router.post('/login', async (req, res) => {
  const { status, json } = await authService('/login', { email: req.body && req.body.email, password: req.body && req.body.password });
  if (status !== 200 || !json || !json.success || !json.data || !json.data.accessToken) {
    return res.status(status || 401).json({ error: (json && json.error) || { code: 'LOGIN_FAILED', message: 'Invalid credentials' } });
  }
  const { accessToken, refreshToken, user } = json.data;
  const { c, csrfToken } = await establish(req, res, accessToken, refreshToken);
  return res.json({ user: { id: user && user.id, email: user && user.email, fullName: user && user.fullName, roles: c.roles || [], orgId: c.org_id ?? null }, csrfToken });
});

// GET /auth/me → verify cookie + session; canonical user (NO token).
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies && req.cookies[config.cookie.accessName];
    if (!token) return res.status(401).json({ error: { code: 'NO_SESSION', message: 'No session' } });
    const c = await verifier.verify(token);
    const session = await getSession(c.sid);
    if (!session) return res.status(401).json({ error: { code: 'SESSION_REVOKED', message: 'Session revoked' } });
    return res.json({ user: { userId: c.sub, email: c.email, orgId: c.org_id ?? null, roles: c.roles || [], permissions: c.permissions || [], sessionId: c.sid }, csrfToken: session.csrfToken });
  } catch (err) {
    return res.status(401).json({ error: { code: err.code || 'INVALID_SESSION', message: err.message } });
  }
});

// POST /auth/refresh → rotate access cookie + new session/csrf. NO token in body.
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies && req.cookies[config.cookie.refreshName];
  if (!refreshToken) return res.status(401).json({ error: { code: 'NO_REFRESH', message: 'No refresh cookie' } });
  const { status, json } = await authService('/refresh', { refreshToken });
  if (status !== 200 || !json || !json.success || !json.data || !json.data.accessToken) {
    clearCookies(res);
    return res.status(401).json({ error: { code: 'REFRESH_FAILED', message: 'Refresh failed' } });
  }
  const { accessToken, refreshToken: newRefresh } = json.data;
  const { csrfToken } = await establish(req, res, accessToken, newRefresh || refreshToken);
  return res.json({ ok: true, csrfToken });
});

// POST /auth/logout → revoke (blacklist jti + delete session) + clear cookies.
router.post('/logout', async (req, res) => {
  const token = req.cookies && req.cookies[config.cookie.accessName];
  if (token) { const c = decode(token); await revoke(c.sid, c.jti, c.exp); }
  clearCookies(res);
  try { await authService('/logout', {}, req.headers.cookie); } catch { /* best-effort */ }
  return res.json({ ok: true });
});

// GET /.well-known/session → lightweight probe for the auth-sdk cookie mode.
router.get('/.well-known/session', async (req, res) => {
  const token = req.cookies && req.cookies[config.cookie.accessName];
  if (!token) return res.json({ authenticated: false });
  try {
    const c = await verifier.verify(token);
    const session = await getSession(c.sid);
    return res.json({ authenticated: !!session, mode: 'cookie', userId: session ? c.sub : null });
  } catch { return res.json({ authenticated: false }); }
});

// POST /auth/step-up — re-verify credentials and elevate the current session.
// The elevated state (stepUpLevel='elevated') expires in 300 seconds.
// Body: { email, password }
// Does NOT issue new cookies or tokens — only updates the Redis session record.
router.post('/step-up', requireSession(), async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: { code: 'STEP_UP_MISSING_CREDS', message: 'email and password required for step-up' } });
  }
  let loginResult;
  try {
    loginResult = await authService('/login', { email, password });
  } catch {
    return res.status(502).json({ error: { code: 'STEP_UP_SERVICE_ERROR', message: 'Auth service unavailable' } });
  }
  const { status, json } = loginResult;
  if (status !== 200 || !json || !json.success || !json.data || !json.data.user) {
    return res.status(401).json({ error: { code: 'STEP_UP_FAILED', message: 'Step-up credential verification failed' } });
  }
  if (String(json.data.user.id) !== String(req._session.userId)) {
    return res.status(403).json({ error: { code: 'STEP_UP_USER_MISMATCH', message: 'Credential does not match the current session user' } });
  }
  const now = Math.floor(Date.now() / 1000);
  const stepUpExpiresAt = now + 300;
  await updateSession(req._claims.sid, { stepUpAt: now, stepUpLevel: 'elevated', stepUpExpiresAt });
  return res.json({ ok: true, stepUpLevel: 'elevated', stepUpExpiresAt });
});

// GET /auth/step-up/status — check whether the current session has an active step-up elevation.
router.get('/step-up/status', requireSession(), (req, res) => {
  const s = req._session;
  const now = Math.floor(Date.now() / 1000);
  const elevated = s.stepUpLevel === 'elevated' && s.stepUpExpiresAt && s.stepUpExpiresAt > now;
  return res.json({
    elevated,
    stepUpLevel:     elevated ? 'elevated' : 'standard',
    stepUpExpiresAt: elevated ? s.stepUpExpiresAt : null,
    stepUpTtlRemaining: elevated ? s.stepUpExpiresAt - now : 0,
  });
});

module.exports = router;
