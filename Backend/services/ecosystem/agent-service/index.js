'use strict';
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
const db = require('./models');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);
app.use(helmet());
// Global IP rate limiter (express-rate-limit, CodeQL-recognized) — generous DoS ceiling.
app.use(rateLimit({ windowMs: 60_000, max: Number(process.env.IP_RATE_LIMIT_MAX) || 1000, standardHeaders: true, legacyHeaders: false, message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } } }));
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(requestContext);

app.get('/', (req, res) => res.json({ service: 'Baalvion Agent Management', version: config.apiVersion, surface: ['agents', 'commissions', 'leaderboard', 'training'] }));
app.get('/health', (req, res) => res.json({
    status: 'ok', service: 'agent-service', timestamp: new Date().toISOString(),
    rs256: jwt.isRs256Enabled(), redis: redis.isAvailable() ? 'ok' : 'unavailable',
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
        logger.info('[agent-service] DB ready');
    } catch (err) {
        logger.error({ err: err.message }, '[agent-service] DB init failed');
        process.exit(1);
    }

    await redis.connect();
    server.listen(config.port, () => logger.info(`[agent-service] running on port ${config.port} (RS256=${jwt.isRs256Enabled()})`));

    const shutdown = async () => { server.close(() => process.exit(0)); };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
};

if (require.main === module) start();
module.exports = app;
