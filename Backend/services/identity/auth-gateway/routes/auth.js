'use strict';
// Auth gateway endpoints. The access token is NEVER returned in a body — only HttpOnly cookies.
// Login/refresh proxy to auth-service (RS256); the gateway manages cookies + CSRF + session binding.
const { Router } = require('express');
const config = require('../config/appConfig');
const verifier = require('../lib/verifier');
const { createSession, getSession, revoke, updateSession } = require('../lib/redisSession');
const { genToken, sha256 } = require('../lib/crypto');
const { detectGeo } = require('../lib/geoDetect');
const { requireSession, requireCsrf } = require('../middleware/session');

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
    sid: c.sid, userId: c.sub, orgId: c.org_id, orgType: c.org_type ?? null, roles: c.roles, exp: c.exp,
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
// Three possible auth-service outcomes (all returned as success): a full token pair (establish the
// session), `mfa_required` (already-enrolled second factor), or `mfa_enrollment_required` (force-MFA
// — the user must enrol before a session exists). The latter two return 200 with the challenge token
// and NO cookies (there is no session yet); the client drives the MFA step from there.
router.post('/login', async (req, res) => {
  const { status, json } = await authService('/login', { email: req.body && req.body.email, password: req.body && req.body.password });
  // Genuine auth failure: non-2xx, or a 2xx with no usable data payload.
  if ((status !== 200 && status !== 201) || !json || !json.success || !json.data) {
    return res.status(status || 401).json({ error: (json && json.error) || { code: 'LOGIN_FAILED', message: 'Invalid credentials' } });
  }
  const data = json.data;
  // MFA continuation paths — no session/cookies yet, just relay the challenge token.
  if (data.mfa_required) {
    return res.status(200).json({ mfaRequired: true, challengeToken: data.challengeToken });
  }
  if (data.mfa_enrollment_required) {
    return res.status(200).json({ mfaEnrollmentRequired: true, challengeToken: data.challengeToken });
  }
  if (!data.accessToken) {
    return res.status(401).json({ error: (json && json.error) || { code: 'LOGIN_FAILED', message: 'Invalid credentials' } });
  }
  const { accessToken, refreshToken, user } = data;
  const { c, csrfToken } = await establish(req, res, accessToken, refreshToken);
  return res.json({ user: { id: user && user.id, email: user && user.email, fullName: user && user.fullName, roles: c.roles || [], orgId: c.org_id ?? null, orgType: c.org_type ?? null }, csrfToken });
});

// POST /auth/register → auth-service register (registers + auto-logs-in) → cookies + SAFE profile + csrf.
// Mirrors /login exactly; the access token is NEVER returned in the body.
router.post('/register', async (req, res) => {
  const { status, json } = await authService('/register', {
    email:    req.body && req.body.email,
    password: req.body && req.body.password,
    fullName: req.body && req.body.fullName,
    orgName:  req.body && req.body.orgName,
  });
  if ((status !== 200 && status !== 201) || !json || !json.success || !json.data || !json.data.accessToken) {
    return res.status(status || 400).json({ error: (json && json.error) || { code: 'REGISTER_FAILED', message: 'Registration failed' } });
  }
  const { accessToken, refreshToken, user } = json.data;
  const { c, csrfToken } = await establish(req, res, accessToken, refreshToken);
  return res.status(201).json({ user: { id: user && user.id, email: user && user.email, fullName: user && user.fullName, roles: c.roles || [], orgId: c.org_id ?? null, orgType: c.org_type ?? null }, csrfToken });
});

// POST /auth/invite → invite a member to the caller's org. Requires a valid session; forwards the
// session's access token to auth-service's team API (POST /v1/orgs/:orgId/invite). Body: { email, role }.
router.post('/invite', requireSession(), async (req, res) => {
  const orgId = req._claims && req._claims.org_id;
  const accessToken = req.cookies && req.cookies[config.cookie.accessName];
  if (!orgId || !accessToken) {
    return res.status(401).json({ error: { code: 'NO_ORG_CONTEXT', message: 'No org context in session' } });
  }
  const { email, role } = req.body || {};
  try {
    const r = await fetch(`${config.authServiceUrl}/orgs/${encodeURIComponent(orgId)}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ email, role }),
    });
    let json = null; try { json = await r.json(); } catch { /* no body */ }
    return res.status(r.status).json(json || { ok: r.ok });
  } catch {
    return res.status(502).json({ error: { code: 'INVITE_SERVICE_ERROR', message: 'Invite service unavailable' } });
  }
});

// ── Authenticated auth-service passthrough ─────────────────────────────────────
// /auth/svc/* → forwards to auth-service /v1/auth/* with the session's access token as Bearer.
// This is the single seam through which the frontend reaches the full self-service admin
// surface (platform org management, members, invitations, user lifecycle, MFA enrolment, audit)
// WITHOUT a bespoke gateway route per endpoint. Session is required + CSRF on unsafe methods.
// auth-service still enforces org membership + capability checks on its side.
router.all('/svc/*', requireSession(), requireCsrf, async (req, res) => {
  const accessToken = req.cookies && req.cookies[config.cookie.accessName];
  if (!accessToken) return res.status(401).json({ error: { code: 'NO_SESSION', message: 'No session' } });

  // req.url inside this router looks like '/svc/platform/organizations?search=x'.
  const rest = req.url.replace(/^\/svc/, '') || '/';
  const target = `${config.authServiceUrl}${rest}`;
  const method = req.method.toUpperCase();
  const hasBody = !['GET', 'HEAD'].includes(method);

  try {
    const r = await fetch(target, {
      method,
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
      ...(hasBody ? { body: JSON.stringify(req.body || {}) } : {}),
    });
    let json = null; try { json = await r.json(); } catch { /* no body */ }
    return res.status(r.status).json(json ?? { ok: r.ok });
  } catch {
    return res.status(502).json({ error: { code: 'AUTH_SVC_UNAVAILABLE', message: 'Auth service unavailable' } });
  }
});

// ── Public (unauthenticated) auth-service passthroughs ─────────────────────────
// Invitation discovery (no session — the invitee is not logged in yet).
router.get('/validate-invite', async (req, res) => {
  try {
    const q = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const r = await fetch(`${config.authServiceUrl}/validate-invite${q}`, { method: 'GET' });
    let json = null; try { json = await r.json(); } catch { /* no body */ }
    return res.status(r.status).json(json ?? { ok: r.ok });
  } catch {
    return res.status(502).json({ error: { code: 'AUTH_SVC_UNAVAILABLE', message: 'Auth service unavailable' } });
  }
});

// Accept invite → auth-service creates/joins the user and returns a token pair; the gateway
// establishes the session cookies (auto-login) exactly like /login. NO token in the body.
router.post('/accept-invite', async (req, res) => {
  const { status, json } = await authService('/accept-invite', req.body || {});
  if ((status !== 200 && status !== 201) || !json || !json.success || !json.data || !json.data.accessToken) {
    return res.status(status || 400).json({ error: (json && json.error) || { code: 'ACCEPT_INVITE_FAILED', message: 'Could not accept invitation' } });
  }
  const { accessToken, refreshToken, user } = json.data;
  const { c, csrfToken } = await establish(req, res, accessToken, refreshToken);
  return res.status(201).json({ user: { id: user && user.id, email: user && user.email, fullName: user && user.fullName, roles: c.roles || [], orgId: c.org_id ?? null, orgType: c.org_type ?? null }, csrfToken });
});

// Onboarding intake — public (the applicant has no session yet). Forwards the
// completed department-wizard submission to auth-service, which creates a
// `pending` organization for the platform review queue. Never grants access.
router.post('/onboarding-application', async (req, res) => {
  const { status, json } = await authService('/onboarding-application', req.body || {});
  return res.status(status || 502).json(json ?? { error: { code: 'ONBOARDING_SERVICE_ERROR', message: 'Onboarding service unavailable' } });
});

// Forgot / reset password — public, silent passthrough (no session).
router.post('/forgot-password', async (req, res) => {
  const { status, json } = await authService('/forgot-password', req.body || {});
  return res.status(status || 200).json(json ?? { ok: true });
});
router.post('/reset-password', async (req, res) => {
  const { status, json } = await authService('/reset-password', req.body || {});
  return res.status(status || 200).json(json ?? { ok: true });
});

// MFA login challenge (second step after /login returns mfa_required) → establish cookies.
router.post('/mfa-challenge', async (req, res) => {
  const { status, json } = await authService('/mfa/challenge', req.body || {});
  if (status !== 200 || !json || !json.success || !json.data || !json.data.accessToken) {
    return res.status(status || 401).json({ error: (json && json.error) || { code: 'MFA_FAILED', message: 'MFA verification failed' } });
  }
  const { accessToken, refreshToken, user } = json.data;
  const { c, csrfToken } = await establish(req, res, accessToken, refreshToken);
  return res.json({ user: { id: user && user.id, email: user && user.email, fullName: user && user.fullName, roles: c.roles || [], orgId: c.org_id ?? null, orgType: c.org_type ?? null }, csrfToken });
});

// POST /auth/mfa-enroll/start (public) → fetch the provisioning material (QR + secret + recovery
// codes) for the force-MFA enrolment challenge. NO cookies — the challenge is not yet consumed.
router.post('/mfa-enroll/start', async (req, res) => {
  const { status, json } = await authService('/mfa/enroll/start', { challengeToken: req.body && req.body.challengeToken });
  if (status !== 200 || !json || !json.success || !json.data) {
    return res.status(status || 400).json({ error: (json && json.error) || { code: 'MFA_ENROLL_FAILED', message: 'Could not start MFA enrolment' } });
  }
  const { qrCodeUrl, secret, recoveryCodes } = json.data;
  return res.json({ qrCodeUrl, secret, recoveryCodes });
});

// POST /auth/mfa-enroll (public) → confirm the code, activate MFA, consume the challenge and
// establish the session (auto-login) exactly like /mfa-challenge. NO token in the body.
router.post('/mfa-enroll', async (req, res) => {
  const { status, json } = await authService('/mfa/enroll', { challengeToken: req.body && req.body.challengeToken, code: req.body && req.body.code });
  if ((status !== 200 && status !== 201) || !json || !json.success || !json.data || !json.data.accessToken) {
    return res.status(status || 401).json({ error: (json && json.error) || { code: 'MFA_ENROLL_FAILED', message: 'MFA enrolment failed' } });
  }
  const { accessToken, refreshToken, user } = json.data;
  const { c, csrfToken } = await establish(req, res, accessToken, refreshToken);
  return res.json({ user: { id: user && user.id, email: user && user.email, fullName: user && user.fullName, roles: c.roles || [], orgId: c.org_id ?? null, orgType: c.org_type ?? null }, csrfToken });
});

// GET /auth/me → verify cookie + session; canonical user (NO token).
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies && req.cookies[config.cookie.accessName];
    if (!token) return res.status(401).json({ error: { code: 'NO_SESSION', message: 'No session' } });
    const c = await verifier.verify(token);
    const session = await getSession(c.sid);
    if (!session) return res.status(401).json({ error: { code: 'SESSION_REVOKED', message: 'Session revoked' } });
    return res.json({ user: { userId: c.sub, email: c.email, orgId: c.org_id ?? null, orgType: c.org_type ?? null, roles: c.roles || [], permissions: c.permissions || [], sessionId: c.sid }, csrfToken: session.csrfToken });
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
// SECURITY: revocation uses claims from the VERIFIED token only. If verification fails the token is
// already expired/invalid/tampered — we skip revocation (nothing to revoke) but still clear cookies.
router.post('/logout', async (req, res) => {
  const token = req.cookies && req.cookies[config.cookie.accessName];
  if (token) {
    try {
      const c = await verifier.verify(token);
      if (c && c.sid) await revoke(c.sid, c.jti, c.exp);
    } catch {
      // Token invalid, expired, or tampered — skip revocation (no trusted claims to act on).
    }
  }
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
