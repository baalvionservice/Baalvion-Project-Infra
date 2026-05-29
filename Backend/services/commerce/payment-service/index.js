'use strict';
const express = require('express');
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
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(tenantContext);
app.use(requestContext);
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
app.get('/metrics', metricsHandler);

// Protected routes
app.use('/v1', authMiddleware, v1Routes);
app.use('/api/v1', authMiddleware, v1Routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  try {
    // Authenticate database connection
    await db.sequelize.authenticate();
    console.log('[payment-service] Database connected');

    // Create schema if not exists
    await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS payments');

    // Sync models (dev only)
    if (process.env.DB_SYNC !== 'false' && config.env !== 'production') {
      await db.sequelize.sync({ alter: false });
      console.log('[payment-service] Database models synced');
    }

    // Run migrations
    const { run: runMigrations } = require('./migrate');
    const migrated = await runMigrations();
    console.log(`[payment-service] Migrations applied: ${migrated.applied.length}`);

    // Initialize Kafka producer if enabled
    if (config.features.kafkaEvents) {
      const { initProducer } = require('./services/kafkaService');
      await initProducer();
      console.log('[payment-service] Kafka producer initialized');
    }

    // Start workers if enabled
    if (process.env.QUEUE_WORKERS !== 'false') {
      require('./queue/workers').startWorkers();
      console.log('[payment-service] Queue workers started');
    }

    server.listen(config.port, () => {
      console.log(`[payment-service] ✓ Running on port ${config.port}`);
      console.log(`[payment-service] Environment: ${config.env}`);
    });
  } catch (err) {
    console.error('[payment-service] Startup failed:', err.message);
    process.exit(1);
  }
};

if (require.main === module) start();
module.exports = { app, server };
