'use strict';
// Real /api/* proxy engine (Phase 6C). Mounted behind requireSession + attachUser + requireCsrf.
// TRUST BOUNDARY: strips any client-supplied auth/cookie, injects ONLY server-resolved, signed
// identity headers. In hybrid mode it also presents the server-side RS256 Bearer so not-yet-migrated
// backends keep verifying JWT; in strict mode backends trust the gateway headers via gatewayTrust().
// Phase 7: additionally injects v2 identity envelope (x-identity-envelope + x-envelope-sig).
const { createProxyMiddleware } = require('http-proxy-middleware');
const { signIdentity } = require('../lib/crypto');
const { build: buildEnvelope } = require('../lib/envelope');
const { detectGeo } = require('../lib/geoDetect');
const config = require('../config/appConfig');

// /api/<svc>/... → domain backend. Extend as services are onboarded.
const TARGETS = {
  mining:        process.env.SVC_MINING        || 'http://localhost:3003',
  imperialpedia: process.env.SVC_IMPERIALPEDIA || 'http://localhost:3004',
  ir:            process.env.SVC_IR            || 'http://localhost:3008',
  dashboard:     process.env.SVC_DASHBOARD     || 'http://localhost:3009',
  ctm:           process.env.SVC_CTM           || 'http://localhost:3011',
  orders:        process.env.SVC_ORDERS        || 'http://localhost:3013',
  proxy:         process.env.SVC_PROXY         || 'http://localhost:4000',
  // Phase 6E-5 — island backends (dual-auth via bffBridge; gateway is the preferred path).
  'elite-circle': process.env.SVC_ELITE_CIRCLE || 'http://localhost:3051',
  insiders:       process.env.SVC_INSIDERS     || 'http://localhost:3050',
  trade:          process.env.SVC_TRADE        || 'http://localhost:3025',
};

const svcOf = (url) => (url.split('?')[0].split('/')[1] || '');

const proxy = createProxyMiddleware({
  changeOrigin: true,
  // mounted at /api → req.url is /<svc>/... ; resolve the per-service target.
  router: (req) => TARGETS[svcOf(req.url)],
  // strip the /<svc> prefix; per-backend base path (e.g. /api/v1) is set on the target if needed.
  pathRewrite: (path) => path.replace(/^\/[^/?]+/, '') || '/',
  // http-proxy-middleware v3: event handlers live under `on` (the v2 top-level
  // onProxyReq/onError are ignored, which silently disables the trust boundary).
  on: {
    proxyReq: (proxyReq, req) => {
      proxyReq.removeHeader('authorization');      // NEVER forward a client token
      proxyReq.removeHeader('cookie');             // NEVER leak the session cookie to backends
      // defensively strip any client-supplied identity headers before we inject ours
      proxyReq.removeHeader('x-user-id');
      proxyReq.removeHeader('x-org-id');
      proxyReq.removeHeader('x-roles');
      proxyReq.removeHeader('x-session-id');
      proxyReq.removeHeader('x-gateway-signature');
      proxyReq.removeHeader('x-identity-envelope'); // Phase 7 — client cannot spoof envelope
      proxyReq.removeHeader('x-envelope-sig');
      const u = req.user;
      if (!u) { proxyReq.destroy(new Error('NO_SESSION')); return; }
      // v1 identity headers — kept for backends that have not yet upgraded to v2 envelope.
      proxyReq.setHeader('x-user-id', String(u.userId));
      proxyReq.setHeader('x-org-id', u.orgId ? String(u.orgId) : '');
      proxyReq.setHeader('x-roles', JSON.stringify(u.roles || []));
      proxyReq.setHeader('x-session-id', u.sessionId ? String(u.sessionId) : '');
      proxyReq.setHeader('x-gateway-signature', signIdentity(u));
      // Phase 7 — v2 signed envelope (x-identity-envelope + x-envelope-sig).
      // geo comes from geoFence middleware if mounted; falls back to per-request detection.
      const geo = req._geoDetected || detectGeo(req);
      const { payload: envPayload, signature: envSig } = buildEnvelope(u, {
        secret:     config.gatewaySigningSecret,
        region:     config.region,
        workloadId: config.workloadId,
        geo,
        ttlSeconds: config.envelopeTtl,
      });
      proxyReq.setHeader('x-identity-envelope', envPayload);
      proxyReq.setHeader('x-envelope-sig', envSig);
      // hybrid only: present the server-side RS256 Bearer for backends still verifying JWT.
      if (config.enforcementMode !== 'strict' && req._token) proxyReq.setHeader('authorization', `Bearer ${req._token}`);
    },
    error: (err, _req, res) => { try { res.status(502).json({ error: { code: 'BAD_GATEWAY', message: err.message } }); } catch { /* */ } },
  },
});

// Guard: unknown service prefix → 404 (don't proxy to undefined target).
module.exports = function apiProxy(req, res, next) {
  if (!TARGETS[svcOf(req.url)]) return res.status(404).json({ error: { code: 'UNKNOWN_SERVICE', message: 'No backend for this /api prefix' } });
  return proxy(req, res, next);
};
