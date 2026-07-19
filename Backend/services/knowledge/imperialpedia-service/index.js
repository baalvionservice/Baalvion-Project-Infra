require('@baalvion/telemetry/bootstrap');
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config/appConfig');
const requestContext = require('./middleware/requestContext');
const rateLimit = require('./middleware/rateLimit');
const v1Routes = require('./routes/v1');
const { redirectAffiliateClick } = require('./controller/redirectController');
const { optionalAuth } = require('./middleware/authMiddleware');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const db = require('./models');
const { metricsMiddleware, metricsHandler } = require('./middleware/metrics');
const { initGracefulShutdown, registerShutdown } = require('@baalvion/graceful-shutdown');
const { initSdk } = require('./platform/sdk');
const { startEventConsumer, stopEventConsumer } = require('./workers/eventConsumer');
const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.urlencoded({ extended: true }));
// verify captures the raw body for HMAC signature checks (Razorpay webhook) — the JSON parser
// only re-serializes, so signing must happen against these exact bytes, not the parsed object.
app.use(express.json({ limit: '1mb', verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use(cookieParser());
app.use(requestContext);
app.use(metricsMiddleware);
app.use(rateLimit());
app.get('/', (req, res) => res.json({ service: 'Baalvion Imperialpedia Service', version: config.apiVersion }));
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/metrics', metricsHandler);
// Short outbound affiliate redirect — deliberately at the app root (not /api/v1/affiliate-products)
// so the public-facing link stays short. See controller/redirectController.js.
app.get('/r/:trackingCode', optionalAuth, redirectAffiliateClick);
app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);
app.use(notFoundHandler);
app.use(errorHandler);
const start = async () => {
    try {
        await db.sequelize.authenticate();
        await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS imperialpedia');
        await db.sequelize.sync({ alter: false });
        console.log('[Imperialpedia] DB connected and synced');
    } catch (err) { console.error('[Imperialpedia] DB error:', err.message); process.exit(1); }
    server.listen(config.port, () => console.log(`[Imperialpedia] Service running on port ${config.port}`));
    registerShutdown('db', async () => {
        if (db.sequelize && db.sequelize.close) await db.sequelize.close();
    });
    try {
        await initSdk();
        await startEventConsumer();
        registerShutdown('event-consumer', stopEventConsumer);
    } catch (err) {
        console.error('[Imperialpedia] event consumer failed to start:', err.message);
    }
    initGracefulShutdown(server);
};
start();
module.exports = app;
