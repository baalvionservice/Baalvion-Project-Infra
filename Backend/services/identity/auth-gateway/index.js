'use strict';
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
// migration_ready is hard-false until all islands are live and an operator flips it.
// localStorage_present is a client-only fact; the frontend passes it as ?localStorage=.
app.get('/auth-capability-check', async (req, res) => {
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
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[auth-gateway] :${config.port} (${config.env}, mode=${config.enforcementMode})`);
    burnIn.init(redis); // no-op when BURN_IN_MODE != true
  });
}

module.exports = app;
