'use strict';
require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const crypto     = require('crypto');
const config     = require('./config/appConfig');
const redis      = require('./config/redis');
const logger     = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const { startEmailWorker }   = require('./workers/emailWorker');
const { startWebhookWorker } = require('./workers/webhookWorker');
const { startSmsWorker }     = require('./workers/smsWorker');
const { startPushWorker }    = require('./workers/pushWorker');
const { startNotificationWorker } = require('./workers/notificationWorker');
const { startEventConsumer, stopEventConsumer } = require('./workers/eventConsumer');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: false }));

app.use((req, _res, next) => { req.requestId = crypto.randomUUID(); next(); });

app.get('/health', async (_req, res) => {
    const { getQueues } = require('./queue/queues');
    let queueStatus = 'unavailable';
    try {
        const { emailQueue } = getQueues();
        await emailQueue.getWaitingCount();
        queueStatus = 'ok';
    } catch { /* */ }
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

    const shutdown = async () => {
        logger.info('Shutting down notification-service...');
        await stopEventConsumer();
        server.close(() => process.exit(0));
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT',  shutdown);
}

start().catch((err) => {
    logger.error({ err }, 'Failed to start notification-service');
    process.exit(1);
});
