'use strict';
const { Queue, Worker } = require('bullmq');
const config = require('../config/appConfig');

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
        console.log(`[Notifications] CMS event: ${type}`, JSON.stringify(payload));
    }, { connection });

    worker.on('failed', (job, err) => console.error(`[Notifications] Job ${job?.id} failed:`, err.message));
}

async function notifyWorkflowTransition({ contentId, websiteId, action, fromState, toState, actorId }) {
    await notificationQueue.add('workflow-transition', { type: 'cms.workflow.transition', payload: { contentId, websiteId, action, fromState, toState, actorId } }, { removeOnComplete: 100, removeOnFail: 50 });
}

module.exports = { notificationQueue, startNotificationWorker, notifyWorkflowTransition };
