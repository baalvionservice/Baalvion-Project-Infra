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
const authMetrics = require('./observability/authMetrics');
app.get('/metrics', async (req, res) => {
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
        console.log('DB connected');
    } catch (error) {
        console.error('DB connection failed:', error.message);
        process.exit(1);
    }

    initializeSocketServer(server);
    initializeQueues().catch((error) => {
        console.error('Queue initialization skipped:', error.message);
    });

    store.ensureSeed().catch((error) => {
        console.error('Seed initialization failed:', error.message);
    });

    server.listen(config.port, () => {
        console.log(`Baalvion NetStack API listening on port ${config.port}`);
    });
};

startServer();

module.exports = app;