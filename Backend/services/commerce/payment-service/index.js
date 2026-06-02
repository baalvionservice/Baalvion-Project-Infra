'use strict';
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const config = require('./config/appConfig');
const { tenantContext } = require('./middleware/tenantContext');
const { requestContext } = require('./middleware/requestContext');
const authMiddleware = require('./middleware/authMiddleware');
const { metricsMiddleware, metricsHandler } = require('./middleware/metrics');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const db = require('./models');

const v1Routes = require('./routes/v1');
const gatewayRoutes = require('./routes/gateway');
const gatewayWebhookRoutes = require('./routes/gatewayWebhooks');
const internalAuthGuard = require('./middleware/internalAuthGuard');
const { createRateLimit } = require('./middleware/rateLimit');
const traceMiddleware = require('./platform/trace');
const { bootstrapPlatform } = require('./platform/bootstrap');
const { logger } = require('./platform/logger');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);
app.use(helmet());
// Global IP rate limiter for ALL routes (the /gateway routes below add tighter per-route limits).
app.use(createRateLimit({ windowMs: 60_000, max: Number(process.env.IP_RATE_LIMIT_MAX) || 1000, key: 'global' }));
app.use(cors({ origin: config.corsOrigins, credentials: true }));
// Capture the raw request body so provider webhook signatures can be verified
// against the exact bytes (Razorpay/Stripe sign the raw payload).
const captureRaw = (req, res, buf) => { req.rawBody = buf; };
app.use(express.urlencoded({ extended: true, verify: captureRaw }));
app.use(express.json({ limit: '10mb', verify: captureRaw }));
app.use(cookieParser());
app.use(requestContext);
app.use(traceMiddleware);

// ── Gateway-checkout vertical (SDK-native: Razorpay/Stripe/PayU) ──
// Tenant comes from the request (body / ?site=), NOT an x-tenant-id header, so
// these mount BEFORE the global tenantContext guard. Webhooks carry no JWT — they
// are authenticated by provider signature verification inside the handler, behind
// a rate limiter. The authed create/read API is guarded by sdk.internalAuth.
const webhookRateLimit = createRateLimit({ windowMs: 60_000, max: 120, key: 'gw-webhook' });
const gatewayApiRateLimit = createRateLimit({ windowMs: 60_000, max: 120, key: 'gw-api' });
app.use('/v1/gateway/webhooks', webhookRateLimit, gatewayWebhookRoutes);
app.use('/api/v1/gateway/webhooks', webhookRateLimit, gatewayWebhookRoutes);
app.use('/v1/gateway', gatewayApiRateLimit, internalAuthGuard, gatewayRoutes);
app.use('/api/v1/gateway', gatewayApiRateLimit, internalAuthGuard, gatewayRoutes);

app.use(metricsMiddleware);

// Health checks
app.get('/', (req, res) => res.json({
  service: 'Baalvion Payment Service',
  version: config.apiVersion,
  description: 'Payment processing & routing for Global Trade Infrastructure'
}));
app.get('/health', (req, res) => res.json({
  status: 'ok',
  service: 'payment-service',
  port: config.port,
  timestamp: new Date().toISOString()
}));
app.get('/health/live', (req, res) => res.json({
  status: 'alive',
  timestamp: new Date().toISOString()
}));
app.get('/health/ready', async (req, res) => {
  try {
    await db.sequelize.authenticate();
    return res.json({
      status: 'ready',
      db: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(503).json({
      status: 'not_ready',
      db: 'unavailable',
      error: err.message
    });
  }
});
// Helm-probe aliases (/healthz liveness, /readyz readiness with DB check).
app.get('/healthz', (req, res) => res.json({ status: 'alive', service: 'payment-service' }));
app.get('/readyz', async (req, res) => {
  try { await db.sequelize.authenticate(); return res.json({ status: 'ready', db: 'connected' }); }
  catch (err) { return res.status(503).json({ status: 'not_ready', db: 'unavailable', error: err.message }); }
});
app.get('/metrics', metricsHandler);

// Protected routes
// authMiddleware (verified RS256) runs BEFORE tenantContext so the tenant is
// derived from the verified JWT org claim, not an untrusted header.
app.use('/v1', authMiddleware, tenantContext, v1Routes);
app.use('/api/v1', authMiddleware, tenantContext, v1Routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  try {
    // Authenticate database connection
    await db.sequelize.authenticate();
    logger('boot').info({}, 'database connected');

    // Create schema if not exists
    await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS payments');

    // Initialise the platform SDK (config/keys, logging, tracing, events,
    // internal-auth, resilient HTTP) BEFORE the listener accepts traffic.
    await bootstrapPlatform(app);

    // Sync models (dev only) — creates the gateway-checkout tables + unique
    // dedup constraints when DB_SYNC isn't disabled.
    if (process.env.DB_SYNC !== 'false' && config.env !== 'production') {
      await db.sequelize.sync({ alter: false });
      logger('boot').info({}, 'database models synced');
    }

    // Run legacy SQL migrations (opt-out). The gateway-checkout vertical uses
    // sync / its own idempotent migration, so a legacy-migration fault must NOT
    // block the SDK-native service from starting.
    if (process.env.RUN_MIGRATIONS !== 'false') {
      try {
        const { run: runMigrations } = require('./migrate');
        const migrated = await runMigrations();
        logger('boot').info({ applied: migrated.applied.length }, 'migrations applied');
      } catch (e) {
        logger('boot').warn({ err: e && e.message }, 'legacy migrations skipped (non-fatal)');
      }
    }

    // Initialize Kafka producer if enabled (legacy interbank stack)
    if (config.features.kafkaEvents) {
      const { initProducer } = require('./services/kafkaService');
      await initProducer();
      logger('boot').info({}, 'kafka producer initialized');
    }

    // Start workers if enabled (legacy interbank stack)
    if (process.env.QUEUE_WORKERS !== 'false') {
      require('./queue/workers').startWorkers();
      logger('boot').info({}, 'queue workers started');
    }

    server.listen(config.port, () => {
      logger('boot').info({ port: config.port, env: config.env }, 'payment-service listening');
    });
  } catch (err) {
    logger('boot').error({ err: err && err.message }, 'payment-service startup failed');
    process.exit(1);
  }
};

if (require.main === module) start();
module.exports = { app, server };
