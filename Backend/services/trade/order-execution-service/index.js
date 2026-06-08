'use strict';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const config = require('./config/appConfig');
const requestContext = require('./middleware/requestContext');
const rateLimit = require('./middleware/rateLimit');
const v1Routes = require('./routes/v1');
const { notFoundHandler, errorHandler } = require('./middleware/error');
const db = require('./models');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.urlencoded({ extended: true }));
// Capture raw bytes so the HMAC finance-events webhook can verify the exact payload.
app.use(express.json({ limit: '2mb', verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use(cookieParser());
app.use(requestContext);
app.use(rateLimit());

app.get('/', (req, res) => res.json({ service: config.service, version: config.version }));
app.get('/health', (req, res) => res.json({ status: 'ok', service: config.service, port: config.port, timestamp: new Date().toISOString() }));
app.get('/health/live', (req, res) => res.json({ status: 'alive', timestamp: new Date().toISOString() }));
app.get('/health/ready', async (req, res) => {
    try { await db.sequelize.authenticate(); return res.json({ status: 'ready', db: 'connected' }); }
    catch (err) { return res.status(503).json({ status: 'not_ready', db: 'unavailable', error: err.message }); }
});

app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);
app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    try {
        await db.sequelize.authenticate();
        if (config.bootstrapMigrations && config.env !== 'production') {
            const { run } = require('./migrate');
            const r = await run();
            console.log(`[${config.service}] migrations applied this boot: ${r.applied.length}`);
        }
    } catch (err) {
        console.error(`[${config.service}] DB connection failed:`, err.message);
        process.exit(1);
    }
    // SDK-dependent background work (outbox relay + event consumer).
    try {
        const { initSdk } = require('./platform/sdk');
        const sdk = await initSdk();
        if (config.startOutboxPublisher) require('./services/outboxPublisher').startOutboxPublisher(sdk);
        if (config.startEventConsumer) await require('./workers/eventConsumer').startEventConsumer();
        if (config.startPaymentSimulator) await require('./workers/paymentSimulator').startPaymentSimulator();
    } catch (err) {
        console.warn(`[${config.service}] SDK/background init degraded:`, err.message);
    }
    app.listen(config.port, () => console.log(`[${config.service}] running on port ${config.port}`));
};

if (require.main === module) start();
module.exports = app;
