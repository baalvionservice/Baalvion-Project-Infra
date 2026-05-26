'use strict';
require('dotenv').config();
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const config       = require('./config/appConfig');
const redis        = require('./config/redis');
const logger       = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
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
    app.listen(config.port, () => {
        logger.info({ port: config.port }, 'admin-service started');
    });
}

start().catch((err) => {
    logger.error({ err }, 'Failed to start admin-service');
    process.exit(1);
});
