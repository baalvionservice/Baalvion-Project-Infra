'use strict';
require('@baalvion/telemetry/bootstrap');
const express = require('express');
const rateLimit = require('express-rate-limit');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');

const config = require('./config/appConfig');
const jwt = require('./config/jwt');
const requestContext = require('./middleware/requestContext');
const v1Routes = require('./routes/v1');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const searchService = require('./services/searchService');
const logger = require('./utils/logger');
const { initGracefulShutdown } = require('@baalvion/graceful-shutdown');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);
app.use(helmet());
// Global IP rate limiter (express-rate-limit, CodeQL-recognized) — generous DoS ceiling.
app.use(rateLimit({ windowMs: 60_000, max: Number(process.env.IP_RATE_LIMIT_MAX) || 1000, standardHeaders: true, legacyHeaders: false, message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } } }));
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(requestContext);

app.get('/', (req, res) => res.json({ service: 'Baalvion Search Service', version: config.apiVersion, engine: 'opensearch' }));
app.get('/health', async (req, res) => {
    const os = await searchService.health();
    // NOTE: config.opensearch.url is intentionally excluded — internal cluster URLs
    // must not be exposed in unauthenticated responses (information disclosure).
    res.status(os.reachable ? 200 : 503).json({
        status: os.reachable ? 'ok' : 'degraded',
        service: 'search-service',
        rs256: jwt.isRs256Enabled(),
        opensearch: { reachable: os.reachable, status: os.status },
    });
});

app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);
app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    // Best-effort index bootstrap — never blocks boot if OpenSearch is down.
    try {
        const os = await searchService.health();
        if (os.reachable) { await searchService.ensureIndices(); logger.info('[Search] indices ensured'); }
        else logger.warn({ url: config.opensearch.url }, '[Search] OpenSearch unreachable — serving in degraded mode');
    } catch (err) {
        logger.warn({ err: err.message }, '[Search] index bootstrap skipped');
    }
    server.listen(config.port, () => logger.info(`[Search] running on port ${config.port} (RS256=${jwt.isRs256Enabled()})`));
    initGracefulShutdown(server);
};

if (require.main === module) start();
module.exports = app;
