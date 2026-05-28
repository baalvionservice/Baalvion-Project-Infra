'use strict';
require('dotenv').config();
const redis   = require('../config/redis');
const logger  = require('../utils/logger');
const { startEmailWorker }   = require('./emailWorker');
const { startWebhookWorker } = require('./webhookWorker');
const { startEventConsumer, stopEventConsumer } = require('./eventConsumer');

async function main() {
    await redis.connect();
    logger.info('Starting notification workers');

    const emailWorker   = startEmailWorker();
    const webhookWorker = startWebhookWorker();

    // Start Redis Streams consumer in background
    startEventConsumer().catch((err) => logger.error({ err }, 'Event consumer crashed'));

    const shutdown = async () => {
        logger.info('Shutting down workers...');
        await stopEventConsumer();
        await emailWorker.close();
        await webhookWorker.close();
        process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT',  shutdown);
}

main().catch((err) => {
    logger.error({ err }, 'Worker startup failed');
    process.exit(1);
});
