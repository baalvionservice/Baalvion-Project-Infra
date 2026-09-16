'use strict';
require('@baalvion/telemetry/bootstrap');
require('dotenv').config();
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const rateLimit    = require('express-rate-limit');
const config       = require('./config/appConfig');
const redis        = require('./config/redis');
const logger       = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const { initGracefulShutdown, registerShutdown } = require('@baalvion/graceful-shutdown');

const app = express();

// Global IP rate limit — generous for an admin console (internal callers only)
const globalLimiter = rateLimit({
    windowMs:       60_000,
    max:            200,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(globalLimiter);
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

    // Consumes `payment.recorded` off the event stream into admin.payment_records — the
    // cross-estate read model behind the payments panel. Opt-in while producers are being
    // migrated; a consumer with no producers is harmless but the flag keeps it off where the
    // stream is not available. Never fatal: the console must still start without it.
    if (process.env.PAYMENT_RECORDS_CONSUMER === 'true') {
        const { startPaymentRecordsConsumer, stopPaymentRecordsConsumer } = require('./service/paymentRecordsConsumer');
        await startPaymentRecordsConsumer().catch((err) => logger.error({ err: err.message }, 'payment-records consumer failed to start'));
        registerShutdown('payment-records-consumer', async () => { await stopPaymentRecordsConsumer(); });
    }

    // Retention sweep for the payments read model. OFF unless PAYMENT_RECORDS_RETENTION_DAYS is
    // set: there is no safe default number of days to keep financial records for.
    const { startRetentionSweep, stopRetentionSweep } = require('./service/paymentRecordsRetention');
    if (startRetentionSweep().started) {
        registerShutdown('payment-records-retention', async () => { stopRetentionSweep(); });
    }

    const server = app.listen(config.port, () => {
        logger.info({ port: config.port }, 'admin-service started');
    });

    // Realtime feed for the admin console's Infrastructure panel. Shares this HTTP server, so it
    // needs no extra port and rides the existing /api-bff/platform/admin route at the edge.
    const { startRealtime, stopRealtime, broadcast } = require('./realtime');
    startRealtime(server, { sequelize: require('./models').sequelize });
    registerShutdown('realtime-ws', async () => { await stopRealtime(); });

    // Status prober — probes every site and service in the catalog, opens incidents on state
    // transitions and pushes to ntfy. OFF unless STATUS_PROBER=true. It shares this process, so
    // a total failure of this box takes the prober with it: STATUS_HEARTBEAT_URL is the external
    // dead-man's switch that covers exactly that case.
    const { startStatusProber, stopStatusProber } = require('./service/statusProbe');
    startStatusProber({
        sequelize: require('./models').sequelize,
        redisClient: require('./config/redis').getClient?.(),
        broadcast,
    });
    registerShutdown('status-prober', async () => { stopStatusProber(); });

    registerShutdown('redis', async () => { const r = require('./config/redis'); const c = (r.getClient && r.getClient()) || r.client || (typeof r.quit === 'function' ? r : null); if (c && c.quit) await c.quit(); });
    initGracefulShutdown(server);
}

start().catch((err) => {
    logger.error({ err }, 'Failed to start admin-service');
    process.exit(1);
});
