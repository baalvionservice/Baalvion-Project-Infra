'use strict';
// Consumes the unified notification queue and fans out across channels via
// dispatchService (email/sms/push/in-app), honoring per-user preferences.
const { Worker } = require('bullmq');
const dispatchService = require('../service/dispatchService');
const redis  = require('../config/redis');
const config = require('../config/appConfig');
const logger = require('../utils/logger');

function startNotificationWorker() {
    const worker = new Worker(
        config.queues.notification,
        async (job) => {
            logger.info({ jobId: job.id, userId: job.data.userId }, 'Processing notification dispatch job');
            return dispatchService.dispatch(job.data);
        },
        { connection: redis.newConnection(), concurrency: parseInt(process.env.NOTIFICATION_WORKER_CONCURRENCY || '10', 10) },
    );

    worker.on('completed', (job) => logger.info({ jobId: job.id }, 'Notification dispatch completed'));
    worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Notification dispatch failed'));

    logger.info('Notification dispatch worker started');
    return worker;
}

module.exports = { startNotificationWorker };
