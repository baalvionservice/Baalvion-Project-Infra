'use strict';

/**
 * BullMQ Worker — emails queue.
 *
 * Supported job types:
 *   - send_transactional : password resets, confirmations, alerts
 *   - send_digest        : scheduled digest / summary emails
 */

const { Worker } = require('bullmq');

const connection = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
};

// ---------------------------------------------------------------------------
// Job handlers (stubs — replace with real nodemailer / SES / SendGrid logic)
// ---------------------------------------------------------------------------

async function handleSendTransactional(job) {
    console.log('[emailWorker] send_transactional — job %s', job.id, job.data);
    // TODO: use nodemailer (already in dependencies) to send the email
}

async function handleSendDigest(job) {
    console.log('[emailWorker] send_digest        — job %s', job.id, job.data);
    // TODO: compile digest template and send via bulk email provider
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

const emailWorker = new Worker(
    'emails',
    async (job) => {
        switch (job.name) {
            case 'send_transactional':
                return handleSendTransactional(job);
            case 'send_digest':
                return handleSendDigest(job);
            default:
                console.warn('[emailWorker] unknown job type: %s', job.name);
        }
    },
    {
        connection,
        concurrency: 5,
    },
);

emailWorker.on('completed', (job) =>
    console.log('[emailWorker] completed job %s (%s)', job.id, job.name),
);

emailWorker.on('failed', (job, err) =>
    console.error('[emailWorker] failed job %s (%s):', job?.id, job?.name, err.message),
);

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

process.on('SIGTERM', async () => {
    console.log('[emailWorker] SIGTERM received — closing worker...');
    await emailWorker.close();
    console.log('[emailWorker] closed');
    process.exit(0);
});

module.exports = emailWorker;
