'use strict';
const express = require('express');
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

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);
app.use(helmet());
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

    const shutdown = async () => { await stopEventConsumer(); server.close(() => process.exit(0)); };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
};

if (require.main === module) start();
module.exports = app;
