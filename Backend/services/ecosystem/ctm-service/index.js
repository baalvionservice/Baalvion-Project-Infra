'use strict';
require('@baalvion/telemetry/bootstrap');
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
const config       = require('./config/appConfig');
const requestContext = require('./middleware/requestContext');
const rateLimit    = require('./middleware/rateLimit');
const v1Routes     = require('./routes/v1');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const db           = require('./models');
const { metricsMiddleware, metricsHandler } = require('./middleware/metrics');
const swaggerUi    = require('swagger-ui-express');
const swaggerSpec  = require('./config/swagger');
const { initGracefulShutdown, registerShutdown } = require('@baalvion/graceful-shutdown');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
// Capture the raw body so payment-provider webhooks can verify HMAC signatures.
app.use(express.json({ limit: '2mb', verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestContext);
app.use(metricsMiddleware);
app.use(rateLimit());

app.get('/', (req, res) => res.json({ service: 'Baalvion CTM Service', version: config.apiVersion }));
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/metrics', metricsHandler);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'CTM API Docs' }));
app.get('/docs.json', (req, res) => res.json(swaggerSpec));

app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    try {
        await db.sequelize.authenticate();
        await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS ctm');
        await db.sequelize.sync({ alter: false });
        console.log('[DB] Connected and schema synced');
    } catch (err) {
        console.error('[DB] Failed to connect:', err.message);
        process.exit(1);
    }
    const server = app.listen(config.port, () =>
        console.log(`Baalvion CTM Service running on port ${config.port}`)
    );
    // Begin periodic real-metric snapshots (telemetry; unref'd so it never blocks exit).
    try { require('./service/observability').startCollector(60000); } catch (e) { console.warn('[obs] collector not started:', e.message); }
    registerShutdown('db', async () => { if (db.sequelize && db.sequelize.close) await db.sequelize.close(); });
    initGracefulShutdown(server);
};

start();
module.exports = app;
