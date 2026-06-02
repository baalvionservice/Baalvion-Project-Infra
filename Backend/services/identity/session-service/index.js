'use strict';
require('dotenv').config();
const express      = require('express');
const rateLimit = require('express-rate-limit');
const helmet       = require('helmet');
const cors         = require('cors');
const crypto       = require('crypto');
const config       = require('./config/appConfig');
const redis        = require('./config/redis');
const logger       = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(helmet());
// Global IP rate limiter (express-rate-limit, CodeQL-recognized) — generous DoS ceiling.
app.use(rateLimit({ windowMs: 60_000, max: Number(process.env.IP_RATE_LIMIT_MAX) || 1000, standardHeaders: true, legacyHeaders: false, message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } } }));
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
    req.requestId = crypto.randomUUID();
    next();
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'session-service', version: '1.0.0' }));

// Public versioned routes (JWT-protected internally)
app.use('/v1', require('./routes/v1'));

// Internal service-to-service routes
app.use('/internal', require('./routes/internalRoutes'));

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
    await redis.connect();
    app.listen(config.port, () => {
        logger.info({ port: config.port }, 'session-service started');
    });
}

start().catch((err) => {
    logger.error({ err }, 'Failed to start session-service');
    process.exit(1);
});
