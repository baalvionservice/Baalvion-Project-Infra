'use strict';
require('@baalvion/telemetry/bootstrap');
require('dotenv').config();
const express      = require('express');
const rateLimit = require('express-rate-limit');
const helmet       = require('helmet');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const crypto       = require('crypto');
const config       = require('./config/appConfig');
const redis        = require('./config/redis');
const logger       = require('./utils/logger');
const { buildJwks }   = require('./utils/keys');
const oauthCtrl       = require('./controller/oauthController');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const db              = require('./models');
const { initGracefulShutdown, registerShutdown } = require('@baalvion/graceful-shutdown');

const app = express();

app.use(helmet());
// Global IP rate limiter (express-rate-limit, CodeQL-recognized) — generous DoS ceiling.
app.use(rateLimit({ windowMs: 60_000, max: Number(process.env.IP_RATE_LIMIT_MAX) || 1000, standardHeaders: true, legacyHeaders: false, message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } } }));
app.use(cors({ origin: config.corsOrigins, credentials: true }));

// Raw body needed before JSON parse so token endpoint can read application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '512kb' }));
app.use(cookieParser());

app.use((req, _res, next) => {
    req.requestId = crypto.randomUUID();
    next();
});

// Health
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'oauth-service', version: '1.0.0' }));

// OIDC discovery
app.get('/.well-known/openid-configuration', oauthCtrl.discovery);
app.get('/.well-known/jwks.json',             oauthCtrl.jwks);

// OAuth2 / OIDC endpoints
app.use('/oauth', require('./routes/oauthRoutes'));

// API v1 (client management, etc.)
app.use('/v1', require('./routes/v1'));

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
    await redis.connect();
    const server = app.listen(config.port, () => {
        logger.info({ port: config.port }, 'oauth-service started');
    });

    // Graceful shutdown (drains HTTP, then runs cleanup handlers in parallel)
    registerShutdown('redis', async () => {
        const r = require('./config/redis');
        const c = (r.getClient && r.getClient()) || r.client || (typeof r.quit === 'function' ? r : null);
        if (c && c.quit) await c.quit();
    });
    registerShutdown('db', async () => {
        if (db.sequelize && db.sequelize.close) await db.sequelize.close();
    });
    initGracefulShutdown(server);
}

start().catch((err) => {
    logger.error({ err }, 'Failed to start oauth-service');
    process.exit(1);
});
