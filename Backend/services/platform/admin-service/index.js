'use strict';
require('@baalvion/telemetry/bootstrap');
require('dotenv').config();
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const rateLimit    = require('express-rate-limit');
const config       = require('./config/appConfig');
const redis        = require('./config/redis');
const logger       = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const { initGracefulShutdown, registerShutdown } = require('@baalvion/graceful-shutdown');

const app = express();

// Global IP rate limit — generous for an admin console (internal callers only)
const globalLimiter = rateLimit({
    windowMs:       60_000,
    max:            200,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(globalLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID
app.use((req, _res, next) => {
    req.requestId = require('crypto').randomUUID();
    next();
});

// Health
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'admin-service', version: '1.0.0' }));

// Routes
app.use('/v1', require('./routes/v1'));

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
    await redis.connect();
    const server = app.listen(config.port, () => {
        logger.info({ port: config.port }, 'admin-service started');
    });

    registerShutdown('redis', async () => { const r = require('./config/redis'); const c = (r.getClient && r.getClient()) || r.client || (typeof r.quit === 'function' ? r : null); if (c && c.quit) await c.quit(); });
    initGracefulShutdown(server);
}

start().catch((err) => {
    logger.error({ err }, 'Failed to start admin-service');
    process.exit(1);
});
