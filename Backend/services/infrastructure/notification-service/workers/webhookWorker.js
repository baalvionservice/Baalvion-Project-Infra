'use strict';
const { Worker } = require('bullmq');
const webhookService = require('../service/webhookService');
const redis          = require('../config/redis');
const config         = require('../config/appConfig');
const logger         = require('../utils/logger');

function startWebhookWorker() {
    const worker = new Worker(
        config.queues.webhook,
        async (job) => {
            const { url, event, data, secret, webhookId } = job.data;
            logger.info({ jobId: job.id, url, event }, 'Processing webhook job');
            return webhookService.deliverWebhook({ url, event, data, secret, webhookId });
        },
        {
            connection:  redis.newConnection(),
            concurrency: parseInt(process.env.WEBHOOK_WORKER_CONCURRENCY || '10', 10),
        },
    );

    worker.on('failed', (job, err) => {
        if (job && job.attemptsMade >= (job.opts.attempts || 5)) {
            const r = redis.getClient();
            if (r) {
                r.xadd(
                    config.eventBus.dlqStream, '*',
                    'source',   'webhook-worker',
                    'jobId',    job.id || '',
                    'reason',   err.message,
                    'payload',  JSON.stringify(job.data),
                    'failedAt', new Date().toISOString(),
                ).catch(() => {});
            }
        }
        logger.error({ jobId: job?.id, url: job?.data?.url, err }, 'Webhook job failed');
    });

    logger.info('Webhook worker started');
    return worker;
}

module.exports = { startWebhookWorker };
