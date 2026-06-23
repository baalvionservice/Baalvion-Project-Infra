'use strict';
require('@baalvion/telemetry/bootstrap');
require('dotenv').config();
const express    = require('express');
const rateLimit = require('express-rate-limit');
const helmet     = require('helmet');
const cors       = require('cors');
const crypto     = require('crypto');
const config     = require('./config/appConfig');
const redis      = require('./config/redis');
const logger     = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const { initSdk } = require('./platform/sdk');
const traceMiddleware = require('./platform/trace');
const { startEmailWorker }   = require('./workers/emailWorker');
const { startWebhookWorker } = require('./workers/webhookWorker');
const { startSmsWorker }     = require('./workers/smsWorker');
const { startPushWorker }    = require('./workers/pushWorker');
const { startNotificationWorker } = require('./workers/notificationWorker');
const { startEventConsumer, stopEventConsumer } = require('./workers/eventConsumer');
const { validateConfig } = require('./config/validateConfig');
const { initGracefulShutdown, registerShutdown } = require('@baalvion/graceful-shutdown');

// Fail-closed: refuse to boot in production without a real email provider (no silent log-only mail).
validateConfig();

const app = express();

app.use(helmet());
// Global IP rate limiter (express-rate-limit, CodeQL-recognized) — generous DoS ceiling.
app.use(rateLimit({ windowMs: 60_000, max: Number(process.env.IP_RATE_LIMIT_MAX) || 1000, standardHeaders: true, legacyHeaders: false, message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } } }));
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: false }));

app.use((req, _res, next) => { req.requestId = crypto.randomUUID(); next(); });
// SDK trace context for the HTTP layer (correlates logs during request handling).
app.use(traceMiddleware);

app.get('/health', async (_req, res) => {
    const { getQueues } = require('./queue/queues');
    let queueStatus = 'unavailable';
    try {
        const { emailQueue } = getQueues();
        await emailQueue.getWaitingCount();
        queueStatus = 'ok';
    } catch (err) { logger.warn({ err: err && err.message }, 'health check: queue probe failed — reporting queues unavailable'); }
    const pushService = require('./service/pushService');
    res.json({
        status:  'ok',
        service: 'notification-service',
        redis:   redis.isAvailable() ? 'ok' : 'unavailable',
        queues:  queueStatus,
        channels: {
            email: config.email.resendApiKey ? 'resend' : (config.email.smtp.host ? 'smtp' : 'log'),
            sms:   config.sms.provider,
            push:  pushService.resolveProvider(),
            inapp: 'redis-pubsub',
        },
    });
});

app.use('/v1', require('./routes/v1'));

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
    await redis.connect();

    // Initialise the platform SDK (events/logging/tracing/internal-auth) BEFORE the
    // event consumer subscribes and before the HTTP listener accepts traffic.
    await initSdk();

    // Start BullMQ workers in-process
    startEmailWorker();
    startWebhookWorker();
    startSmsWorker();
    startPushWorker();
    startNotificationWorker();

    // Start Redis Streams consumer in background
    startEventConsumer().catch((err) => logger.error({ err }, 'Event consumer crashed'));

    const server = app.listen(config.port, () => {
        logger.info({ port: config.port }, 'notification-service started');
    });

    // Graceful shutdown: drain HTTP, then stop consumer, close queues, quit Redis.
    registerShutdown('event-consumer', async () => { await stopEventConsumer(); });
    registerShutdown('queues', async () => {
        const { getQueues } = require('./queue/queues');
        const q = getQueues();
        await Promise.all(Object.values(q).map((item) => (item && item.close ? item.close() : null)));
    });
    registerShutdown('redis', async () => { const c = redis.getClient && redis.getClient(); if (c && c.quit) await c.quit(); });
    initGracefulShutdown(server);
}

start().catch((err) => {
    logger.error({ err }, 'Failed to start notification-service');
    process.exit(1);
});
