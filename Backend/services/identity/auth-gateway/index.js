'use strict';
const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config/appConfig');
const authRoutes = require('./routes/auth');
const redis = require('./lib/redis');
const authTrace = require('./observability/authTrace');
const burnIn    = require('./observability/burnIn');
const { requireSession, attachUser, requireCsrf } = require('./middleware/session');
const { geoFence } = require('./middleware/geoFence');
const { initGracefulShutdown, registerShutdown } = require('@baalvion/graceful-shutdown');

// Internal-only endpoints: callers must present the INTERNAL_SERVICE_SECRET header value
// (constant-time comparison) or originate from a trusted loopback/private IP.
// In production this key MUST be set; in dev it defaults to a known value so local boot works.
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || (config.env !== 'production' ? 'dev-internal-secret' : '');
if (config.env === 'production' && (!INTERNAL_SECRET || INTERNAL_SECRET === 'dev-internal-secret')) {
  console.error('[auth-gateway] FATAL: INTERNAL_SERVICE_SECRET must be set in production');
  process.exit(1);
}

// Gateway HMAC signing secret: downstream backends trust the gateway only because it holds this.
// In production this key MUST be set to a real value; the dev placeholder is rejected fail-closed.
const SIGNING_SECRET = process.env.GATEWAY_SIGNING_SECRET || '';
if (config.env === 'production' && (!SIGNING_SECRET || SIGNING_SECRET === 'dev_gateway_signing_secret_change_me_min32')) {
  console.error('[auth-gateway] FATAL: GATEWAY_SIGNING_SECRET must be set in production');
  process.exit(1);
}

// Trusted loopback / private-network CIDR prefixes (IPv4 and IPv6).
const TRUSTED_INTERNAL_PREFIXES = ['127.', '::1', '10.', '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.', '192.168.'];
const isInternalIp = (ip) => TRUSTED_INTERNAL_PREFIXES.some((pfx) => (ip || '').startsWith(pfx));

function requireInternalKey(req, res, next) {
  const clientIp = ((req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || (req.socket && req.socket.remoteAddress) || '';
  // Allow trusted internal network callers without a key (e.g. health-check scripts on the same host).
  if (isInternalIp(clientIp)) return next();
  // Otherwise require the shared secret in the Authorization header: "Bearer <secret>" or "ApiKey <secret>".
  const authHeader = req.headers['authorization'] || '';
  const presented = authHeader.startsWith('Bearer ') ? authHeader.slice(7)
    : authHeader.startsWith('ApiKey ') ? authHeader.slice(7)
    : (req.headers['x-internal-key'] || '');
  if (!presented) {
    return res.status(401).json({ error: { code: 'INTERNAL_AUTH_REQUIRED', message: 'Internal key required' } });
  }
  // Constant-time comparison to prevent timing attacks.
  try {
    const a = Buffer.from(presented); const b = Buffer.from(INTERNAL_SECRET);
    const match = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!match) return res.status(403).json({ error: { code: 'INTERNAL_AUTH_INVALID', message: 'Invalid internal key' } });
  } catch {
    return res.status(403).json({ error: { code: 'INTERNAL_AUTH_INVALID', message: 'Invalid internal key' } });
  }
  return next();
}
// /api proxy needs http-proxy-middleware; load lazily so the gateway still serves /auth if it's absent.
let apiProxy;
try {
  apiProxy = require('./routes/proxy');
} catch (e) {
  console.warn('[auth-gateway] /api proxy disabled (http-proxy-middleware missing):', e.message);
  apiProxy = (_req, res) => res.status(503).json({ error: { code: 'PROXY_UNAVAILABLE', message: 'install http-proxy-middleware to enable /api' } });
}

const app = express();

app.use(helmet());
// Global IP rate limiter (express-rate-limit, CodeQL-recognized) — generous DoS ceiling.
app.use(rateLimit({ windowMs: 60_000, max: Number(process.env.IP_RATE_LIMIT_MAX) || 1000, standardHeaders: true, legacyHeaders: false, message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } } }));
app.use(cors({ origin: config.corsOrigins, credentials: true })); // credentials:true required for cookies
app.use(cookieParser());
// Phase 6E-6 — auth-flow observability (logs on response finish; never alters the flow).
app.use(authTrace.middleware('auth-gateway'));
// Phase 6E-6.6 — burn-in anomaly detection (no-op when BURN_IN_MODE != true).
app.use(burnIn.middleware());

app.get('/health', async (_req, res) => {
  let redisOk = false;
  try { redisOk = (await redis.ping()) === 'PONG'; } catch { /* redis down */ }
  const burnInStatus = config.burnInMode ? await burnIn.getStatus() : { burn_in_mode: false };
  res.json({ status: 'ok', service: 'auth-gateway', port: config.port, mode: config.enforcementMode, redis: redisOk, burn_in: burnInStatus });
});

// Phase 6E-6.5 STEP 6 — frontend readiness probe. Returns live PRODUCTION-ONLY metrics.
// SECURITY: gated behind requireInternalKey — only trusted internal callers (loopback/VPC or INTERNAL_SERVICE_SECRET).
// migration_ready is hard-false until all islands are live and an operator flips it.
// localStorage_present is a client-only fact; the frontend passes it as ?localStorage=.
app.get('/auth-capability-check', requireInternalKey, async (req, res) => {
  let redisOk = false;
  try { redisOk = (await redis.ping()) === 'PONG'; } catch { /* redis down */ }
  const ls = req.query.localStorage;

  // Live production metrics — best-effort, null if Redis unavailable.
  let hs256Share = null, mismatchRate = null, tenantDrift = null, islandEventCount = null;
  if (redisOk) {
    try {
      const { analyze } = require('./scripts/authConsistencyCheck');
      const counters = await authTrace.getAllCounters('production');
      const events = await authTrace.getRecentRedis(500, 'production');
      let islandTotal = 0, islandHs = 0;
      for (const svc in counters) {
        if (svc !== 'auth-gateway') {
          islandTotal += counters[svc].total || 0;
          islandHs += counters[svc].src_island_hs256 || 0;
        }
      }
      islandEventCount = islandTotal;
      hs256Share = islandTotal ? +(islandHs / islandTotal).toFixed(4) : 0;
      const consistency = analyze(events);
      mismatchRate = consistency.mismatchRate;
      tenantDrift = consistency.tenantMismatchRate;
    } catch { /* non-fatal — metrics unavailable */ }
  }

  res.json({
    gateway_ready: redisOk,
    cookie_supported: true,
    localStorage_present: ls === 'true' ? true : (ls === 'false' ? false : null),
    migration_ready: false,
    production_metrics_only: true,
    simulation_excluded: true,
    hs256Share,
    mismatchRate,
    tenantDrift,
    islandEventCount,
    mode: config.enforcementMode,
    phase: '6E-6.6',
    burn_in: config.burnInMode ? await burnIn.getStatus() : { burn_in_mode: false },
  });
});

// /auth/* — JSON-parsed (login/refresh/logout/me/.well-known/session).
app.use('/auth', express.json({ limit: '1mb' }), authRoutes);

// /api/* — TRUST BOUNDARY. NO express.json here (the proxy must stream the body to the backend).
//   requireSession → attachUser → requireCsrf → geoFence → signed-identity proxy.
app.use('/api', requireSession(), attachUser, requireCsrf, geoFence(), apiProxy);

app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }));

if (require.main === module) {
  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`[auth-gateway] :${config.port} (${config.env}, mode=${config.enforcementMode})`);
    burnIn.init(redis); // no-op when BURN_IN_MODE != true
  });

  // Graceful shutdown (drains HTTP, then runs cleanup handlers in parallel).
  // Gateway is a reverse proxy with no ./models DB — only the shared Redis client needs closing.
  registerShutdown('redis', async () => {
    const r = require('./lib/redis');
    const c = (r.getClient && r.getClient()) || r.client || (typeof r.quit === 'function' ? r : null);
    if (c && c.quit) await c.quit();
  });
  initGracefulShutdown(server);
}

module.exports = app;
