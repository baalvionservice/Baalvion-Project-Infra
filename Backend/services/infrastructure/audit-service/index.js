'use strict';
require('@baalvion/telemetry/bootstrap');
const express = require('express');
const rateLimit = require('express-rate-limit');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');

const config = require('./config/appConfig');
const jwt = require('./config/jwt');
const redis = require('./config/redis');
const requestContext = require('./middleware/requestContext');
const v1Routes = require('./routes/v1');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const { startEventConsumer, stopEventConsumer } = require('./consumers/eventConsumer');
const db = require('./models');
const logger = require('./utils/logger');
const { initGracefulShutdown, registerShutdown } = require('@baalvion/graceful-shutdown');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);
app.use(helmet());
// Global IP rate limiter (express-rate-limit, CodeQL-recognized) — generous DoS ceiling.
app.use(rateLimit({ windowMs: 60_000, max: Number(process.env.IP_RATE_LIMIT_MAX) || 1000, standardHeaders: true, legacyHeaders: false, message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } } }));
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(requestContext);

app.get('/', (req, res) => res.json({ service: 'Baalvion Audit Service', version: config.apiVersion, model: 'immutable append-only hash-chain' }));
app.get(['/health', '/healthz'], (req, res) => res.json({
    status: 'ok', service: 'audit-service', timestamp: new Date().toISOString(),
    rs256: jwt.isRs256Enabled(), redis: redis.isAvailable() ? 'ok' : 'unavailable',
    eventConsumer: config.eventBus.enabled ? 'on' : 'off',
}));
// Readiness (DB check). Path matches the Helm readiness probe (/readyz).
app.get('/readyz', async (req, res) => {
    try { await db.sequelize.authenticate(); return res.json({ status: 'ready', db: 'connected' }); }
    catch (err) { return res.status(503).json({ status: 'not_ready', db: 'unavailable', error: err.message }); }
});

app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);
app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    try {
        await db.sequelize.authenticate();
        await db.sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${config.db.schema}`);
        await db.sequelize.sync({ alter: false });
        logger.info('[Audit] DB ready');
    } catch (err) {
        logger.error({ err: err.message }, '[Audit] DB init failed');
        process.exit(1);
    }

    await redis.connect();
    startEventConsumer().catch((err) => logger.error({ err: err.message }, 'Event consumer crashed'));

    server.listen(config.port, () => logger.info(`[Audit] running on port ${config.port} (RS256=${jwt.isRs256Enabled()})`));

    // Graceful shutdown: drain HTTP, then clean up event consumer / Redis / DB.
    registerShutdown('event-consumer', async () => { await stopEventConsumer(); });
    registerShutdown('redis', async () => { const c = redis.getClient && redis.getClient(); if (c && c.quit) await c.quit(); });
    registerShutdown('db', async () => { if (db.sequelize && db.sequelize.close) await db.sequelize.close(); });
    initGracefulShutdown(server);
};

if (require.main === module) start();
module.exports = app;
