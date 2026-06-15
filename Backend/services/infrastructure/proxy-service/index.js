const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const config = require('./config/appConfig');
const requestContext = require('./middleware/requestContext');
const rateLimit = require('./middleware/rateLimit');
const v1Routes = require('./routes/v1');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const { initializeSocketServer } = require('./service/socketService');
const { initializeQueues } = require('./service/queueService');
const store = require('./service/platformStore');
const db = require('./models');

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));

// KYC webhook needs the RAW body for HMAC verification — mount before json parser.
app.post('/v1/webhooks/kyc', rateLimit(), express.raw({ type: '*/*' }), require('./controller/privacyController').kycWebhook);

// Razorpay billing webhook (authoritative subscription activation) — also needs the RAW body for
// HMAC verification, so mount before the json parser. No JWT; authenticity is the provider signature.
app.post(
    ['/v1/billing/webhook/razorpay', '/api/v1/billing/webhook/razorpay'],
    rateLimit(),
    express.raw({ type: '*/*' }),
    require('./controller/billingWebhookController').razorpayWebhook,
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(requestContext);
app.use(rateLimit());

app.get('/', (req, res) => {
    res.json({ service: 'Baalvion NetStack API', version: config.apiVersion, wsPath: config.websocket.path });
});

// Public JWKS for RS256 token verification by other services (no shared secret).
const jwtServer = require('./utils/jwtserver');
app.get('/.well-known/jwks.json', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300');
    res.json(jwtServer.getJwks());
});

// Prometheus metrics (auth + default runtime). No-op text if prom-client absent.
// Gated: only localhost/127.x/::1 or callers that present the correct
// METRICS_SECRET token (Authorization: Bearer <token> or ?token=<token>).
const authMetrics = require('./observability/authMetrics');

const METRICS_SECRET = process.env.METRICS_SECRET || '';
const METRICS_IP_ALLOWLIST = (() => {
    const raw = process.env.METRICS_IP_ALLOWLIST || '';
    const parsed = raw.split(',').map((s) => s.trim()).filter(Boolean);
    // Always allow loopback addresses regardless of configuration.
    return new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1', ...parsed]);
})();

// Fail-fast in production if METRICS_SECRET is absent or is the known dev placeholder.
if (config.env === 'production') {
    const DEV_PLACEHOLDERS = ['', 'changeme', 'secret', 'metrics-secret'];
    if (!METRICS_SECRET || DEV_PLACEHOLDERS.includes(METRICS_SECRET.toLowerCase())) {
        // eslint-disable-next-line no-console
        console.error('[FATAL] METRICS_SECRET must be set to a non-default value in production');
        process.exit(1);
    }
}

function metricsGuard(req, res, next) {
    const ip = req.ip || (req.socket && req.socket.remoteAddress) || '';
    if (METRICS_IP_ALLOWLIST.has(ip)) return next();

    // Bearer token or ?token= query param.
    if (METRICS_SECRET) {
        const authHeader = req.headers['authorization'] || '';
        const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
        const queryToken = req.query && req.query.token ? String(req.query.token) : '';
        const provided = bearer || queryToken;
        if (provided && provided === METRICS_SECRET) return next();
    }

    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
}

app.get('/metrics', metricsGuard, async (req, res) => {
    res.set('Content-Type', authMetrics.contentType);
    res.end(await authMetrics.metricsText());
});

app.get('/health', async (req, res) => {
    await store.ensureSeed();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);
// SCIM 2.0 at the IdP-expected path (its own bearer auth + scim+json parser).
app.use('/scim/v2', require('./routes/scimRoutes'));
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
    try {
        await db.sequelize.authenticate();
    } catch (error) {
        process.exit(1);
    }

    initializeSocketServer(server);
    initializeQueues().catch(() => {});

    store.ensureSeed().catch(() => {});

    server.listen(config.port, () => {
        // port is logged by the process manager / container runtime
    });
};

startServer();

module.exports = app;