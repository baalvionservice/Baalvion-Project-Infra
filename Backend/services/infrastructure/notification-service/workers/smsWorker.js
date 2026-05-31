'use strict';
const { Worker } = require('bullmq');
const smsService = require('../service/smsService');
const redis  = require('../config/redis');
const config = require('../config/appConfig');
const logger = require('../utils/logger');

function startSmsWorker() {
    const worker = new Worker(
        config.queues.sms,
        async (job) => {
            const { to, body, idempotencyKey } = job.data;
            logger.info({ jobId: job.id, to }, 'Processing SMS job');
            return smsService.sendSms({ to, body, idempotencyKey });
        },
        { connection: redis.newConnection(), concurrency: parseInt(process.env.SMS_WORKER_CONCURRENCY || '5', 10), limiter: { max: 10, duration: 1000 } },
    );

    worker.on('completed', (job) => logger.info({ jobId: job.id }, 'SMS job completed'));
    worker.on('failed', (job, err) => {
        if (job && job.attemptsMade >= (job.opts.attempts || 4)) {
            const r = redis.getClient();
            if (r) r.xadd(config.eventBus.dlqStream, '*', 'source', 'sms-worker', 'jobId', job.id || '', 'reason', err.message, 'payload', JSON.stringify(job.data), 'failedAt', new Date().toISOString()).catch(() => {});
        }
        logger.error({ jobId: job?.id, err }, 'SMS job failed');
    });

    logger.info('SMS worker started');
    return worker;
}

module.exports = { startSmsWorker };
