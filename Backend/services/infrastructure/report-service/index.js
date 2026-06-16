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
const { startScheduler, stopScheduler } = require('./workers/scheduleWorker');
const queryRunner = require('./services/queryRunner');
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
app.use(express.json({ limit: '4mb' }));
app.use(requestContext);

app.get('/', (req, res) => res.json({ service: 'Baalvion Report Service', version: config.apiVersion, formats: require('./services/exporters').FORMATS }));
app.get('/health', (req, res) => res.json({
    status: 'ok', service: 'report-service', timestamp: new Date().toISOString(),
    rs256: jwt.isRs256Enabled(), redis: redis.isAvailable() ? 'ok' : 'unavailable',
    scheduler: config.reports.schedulerEnabled ? 'on' : 'off',
    datasources: Object.keys(config.reports.datasources),
}));

app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);
app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    try {
        await db.sequelize.authenticate();
        await db.sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${config.db.schema}`);
        await db.sequelize.sync({ alter: false });
        logger.info('[report-service] DB ready');
    } catch (err) {
        logger.error({ err: err.message }, '[report-service] DB init failed');
        process.exit(1);
    }

    await redis.connect();
    startScheduler();

    server.listen(config.port, () => logger.info(`[report-service] running on port ${config.port} (RS256=${jwt.isRs256Enabled()})`));

    registerShutdown('scheduler', async () => { stopScheduler(); });
    registerShutdown('query-runner', async () => { await queryRunner.closeAll(); });
    registerShutdown('redis', async () => { const r = require('./config/redis'); const c = (r.getClient && r.getClient()) || r.client || (typeof r.quit === 'function' ? r : null); if (c && c.quit) await c.quit(); });
    registerShutdown('db', async () => { if (db.sequelize && db.sequelize.close) await db.sequelize.close(); });
    initGracefulShutdown(server);
};

if (require.main === module) start();
module.exports = app;
