'use strict';
const { Worker } = require('bullmq');
const emailService = require('../service/emailService');
const redis        = require('../config/redis');
const config       = require('../config/appConfig');
const logger       = require('../utils/logger');

function startEmailWorker() {
    const worker = new Worker(
        config.queues.email,
        async (job) => {
            const { to, templateName, data, idempotencyKey, rawSubject, rawHtml } = job.data;

            logger.info({ jobId: job.id, to, templateName: templateName || 'raw' }, 'Processing email job');

            if (rawSubject && rawHtml) {
                return emailService.sendRawEmail({ to, subject: rawSubject, html: rawHtml, idempotencyKey });
            }
            return emailService.sendEmail({ to, templateName, data, idempotencyKey });
        },
        {
            connection:  redis.newConnection(),
            concurrency: parseInt(process.env.EMAIL_WORKER_CONCURRENCY || '5', 10),
            limiter: {
                max:      20,
                duration: 1000,
            },
        },
    );

    worker.on('completed', (job) => {
        logger.info({ jobId: job.id }, 'Email job completed');
    });

    worker.on('failed', (job, err) => {
        if (job && job.attemptsMade >= (job.opts.attempts || 4)) {
            // Move to DLQ stream
            const r = redis.getClient();
            if (r) {
                r.xadd(
                    config.eventBus.dlqStream,
                    '*',
                    'source',      'email-worker',
                    'jobId',       job.id || '',
                    'reason',      err.message,
                    'payload',     JSON.stringify(job.data),
                    'failedAt',    new Date().toISOString(),
                ).catch(() => {});
            }
        }
        logger.error({ jobId: job?.id, err }, 'Email job failed');
    });

    logger.info('Email worker started');
    return worker;
}

module.exports = { startEmailWorker };
