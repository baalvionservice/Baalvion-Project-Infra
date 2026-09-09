'use strict';
require('@baalvion/telemetry/bootstrap');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const config = require('./config/appConfig');
const db = require('./models');
const requestContext = require('./middleware/requestContext');
const { ipLimiter } = require('./middleware/rateLimit');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const v1Routes = require('./routes/v1');
const { initGracefulShutdown, registerShutdown } = require('@baalvion/graceful-shutdown');

const app = express();

// Behind the gateway, so the client address comes from the proxy hop. Required for the
// per-IP limiter to key on the caller rather than on the gateway.
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({
    // The service returns JSON only; there is no page to frame, embed or style.
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
}));

// Credentialed CORS against an explicit origin list — never a wildcard, because the
// browser will not send credentials to one and silently degrading to anonymous reads
// would hide the misconfiguration.
app.use(cors({ origin: config.corsOrigins, credentials: true }));

app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false, limit: '256kb' }));
app.use(cookieParser());
app.use(requestContext);
app.use(ipLimiter());

app.get('/', (req, res) => res.json({ service: 'CanWeMarry API', version: config.apiVersion }));

app.get('/health', (req, res) => res.json({
    status: 'ok',
    service: 'canwemarry-service',
    timestamp: new Date().toISOString(),
}));

app.get('/health/ready', async (req, res) => {
    try {
        await db.sequelize.authenticate();
        return res.json({ status: 'ready', db: 'connected' });
    } catch (err) {
        // The reason is logged, not returned: a readiness probe is reachable from
        // anywhere the service is, and connection errors name hosts and users.
        console.error('[canwemarry] readiness check failed', err.message);
        return res.status(503).json({ status: 'not_ready' });
    }
});

app.use(`/${config.apiVersion}`, v1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

// Exported unstarted so the tests can drive it with supertest without binding a port.
module.exports = app;

if (require.main === module) {
    const server = app.listen(config.port, () => {
        console.log(`[canwemarry] listening on :${config.port} (${config.env}), schema '${config.db.schema}'`);
    });
    registerShutdown(async () => { await db.sequelize.close(); });
    initGracefulShutdown(server);
}
