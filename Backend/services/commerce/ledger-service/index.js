'use strict';
const express = require('express');
const rateLimit = require('express-rate-limit');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const config = require('./config/appConfig');
const { tenantContext } = require('./middleware/tenantContext');
const requestContext = require('./middleware/requestContext');
const authMiddleware = require('./middleware/authMiddleware');
const { metricsMiddleware, metricsHandler } = require('./middleware/metrics');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const db = require('./models');

const v1Routes = require('./routes/v1');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);
app.use(helmet());
// Global IP rate limiter (express-rate-limit, CodeQL-recognized) — generous DoS ceiling.
app.use(rateLimit({ windowMs: 60_000, max: Number(process.env.IP_RATE_LIMIT_MAX) || 1000, standardHeaders: true, legacyHeaders: false, message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } } }));
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
// NOTE: tenantContext is NOT global — it 400s requests without x-tenant-id, which would break
// the unauthenticated health/metrics probes below. It is applied only on the protected /v1 mounts.
app.use(requestContext);
app.use(metricsMiddleware);

// Health checks
app.get('/', (req, res) => res.json({
  service: 'Baalvion Ledger Service',
  version: config.apiVersion,
  description: 'Double-entry ledger for Global Trade Infrastructure'
}));
app.get('/health', (req, res) => res.json({
  status: 'ok',
  service: 'ledger-service',
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
// Helm-probe aliases (/healthz liveness, /readyz readiness). Mounted before tenantContext so
// orchestrator probes (which send no x-tenant-id) get 200/503, not a 400 MISSING_TENANT.
app.get('/healthz', (req, res) => res.json({ status: 'alive', service: 'ledger-service' }));
app.get('/readyz', async (req, res) => {
  try { await db.sequelize.authenticate(); return res.json({ status: 'ready', db: 'connected' }); }
  catch (err) { return res.status(503).json({ status: 'not_ready', db: 'unavailable', error: err.message }); }
});
app.get('/metrics', metricsHandler);

// Protected routes — tenantContext applied HERE (after auth, before handlers) so it never
// intercepts the health/metrics probes above.
app.use('/v1', authMiddleware, tenantContext, v1Routes);
app.use('/api/v1', authMiddleware, tenantContext, v1Routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  try {
    // Authenticate database connection
    await db.sequelize.authenticate();
    console.log('[ledger-service] Database connected');

    // Create schema if not exists
    await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS ledger');

    // Sync models (dev only)
    if (process.env.DB_SYNC !== 'false' && config.env !== 'production') {
      await db.sequelize.sync({ alter: false });
      console.log('[ledger-service] Database models synced');
    }

    // Run migrations
    const { run: runMigrations } = require('./migrate');
    const migrated = await runMigrations();
    console.log(`[ledger-service] Migrations applied: ${migrated.applied.length}`);

    // Start workers if enabled
    if (process.env.QUEUE_WORKERS !== 'false') {
      require('./queue/workers').startWorkers();
      console.log('[ledger-service] Queue workers started');
    }

    server.listen(config.port, () => {
      console.log(`[ledger-service] ✓ Running on port ${config.port}`);
      console.log(`[ledger-service] Environment: ${config.env}`);
    });
  } catch (err) {
    console.error('[ledger-service] Startup failed:', err.message);
    process.exit(1);
  }
};

if (require.main === module) start();
module.exports = { app, server };
