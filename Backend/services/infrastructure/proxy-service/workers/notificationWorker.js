'use strict';

/**
 * BullMQ Worker — notifications queue.
 *
 * Supported job types:
 *   - send_in_app  : delivers an in-app notification to the target user
 *   - send_push    : sends a push notification via the configured provider
 */

const { Worker } = require('bullmq');

const connection = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
};

// ---------------------------------------------------------------------------
// Job handlers (stubs — replace with real logic)
// ---------------------------------------------------------------------------

async function handleSendInApp(job) {
    console.log('[notificationWorker] send_in_app — job %s', job.id, job.data);
    // TODO: persist notification to DB and emit via socket.io
}

async function handleSendPush(job) {
    console.log('[notificationWorker] send_push   — job %s', job.id, job.data);
    // TODO: call FCM / APNs / web-push provider
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

const notificationWorker = new Worker(
    'notifications',
    async (job) => {
        switch (job.name) {
            case 'send_in_app':
                return handleSendInApp(job);
            case 'send_push':
                return handleSendPush(job);
            default:
                console.warn('[notificationWorker] unknown job type: %s', job.name);
        }
    },
    {
        connection,
        concurrency: 10,
    },
);

notificationWorker.on('completed', (job) =>
    console.log('[notificationWorker] completed job %s (%s)', job.id, job.name),
);

notificationWorker.on('failed', (job, err) =>
    console.error('[notificationWorker] failed job %s (%s):', job?.id, job?.name, err.message),
);

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

process.on('SIGTERM', async () => {
    console.log('[notificationWorker] SIGTERM received — closing worker...');
    await notificationWorker.close();
    console.log('[notificationWorker] closed');
    process.exit(0);
});

module.exports = notificationWorker;
