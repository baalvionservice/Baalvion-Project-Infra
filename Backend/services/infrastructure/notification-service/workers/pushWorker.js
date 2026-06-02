'use strict';
const { Worker } = require('bullmq');
const pushService = require('../service/pushService');
const redis  = require('../config/redis');
const config = require('../config/appConfig');
const logger = require('../utils/logger');

function startPushWorker() {
    const worker = new Worker(
        config.queues.push,
        async (job) => {
            const { userId, tokens, title, body, data, idempotencyKey } = job.data;
            logger.info({ jobId: job.id, userId }, 'Processing push job');
            return pushService.sendPush({ userId, tokens, title, body, data, idempotencyKey });
        },
        { connection: redis.newConnection(), concurrency: parseInt(process.env.PUSH_WORKER_CONCURRENCY || '10', 10), limiter: { max: 50, duration: 1000 } },
    );

    worker.on('completed', (job) => logger.info({ jobId: job.id }, 'Push job completed'));
    worker.on('failed', (job, err) => {
        if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
            const r = redis.getClient();
            if (r) r.xadd(config.eventBus.dlqStream, '*', 'source', 'push-worker', 'jobId', job.id || '', 'reason', err.message, 'payload', JSON.stringify(job.data), 'failedAt', new Date().toISOString()).catch(() => {});
        }
        logger.error({ jobId: job?.id, err }, 'Push job failed');
    });

    logger.info('Push worker started');
    return worker;
}

module.exports = { startPushWorker };
