'use strict';
const { Queue, Worker } = require('bullmq');
const config = require('../config/appConfig');
const { logger } = require('../platform/logger');

const connection = {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
};

const notificationQueue = new Queue('cms-notifications', { connection });

function startNotificationWorker() {
    const worker = new Worker('cms-notifications', async (job) => {
        const { type, payload } = job.data;
        // Notification delivery is handled by a separate notification service.
        // This worker logs the event; the notification service consumes it.
        logger('notifications').info({ type, payload }, 'cms notification event');
    }, { connection });

    worker.on('failed', (job, err) => logger('notifications').error({ jobId: job && job.id, err: err && err.message }, 'notification job failed'));
}

async function notifyWorkflowTransition({ contentId, websiteId, action, fromState, toState, actorId }) {
    await notificationQueue.add('workflow-transition', { type: 'cms.workflow.transition', payload: { contentId, websiteId, action, fromState, toState, actorId } }, { removeOnComplete: 100, removeOnFail: 50 });
}

module.exports = { notificationQueue, startNotificationWorker, notifyWorkflowTransition };
