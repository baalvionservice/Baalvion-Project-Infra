'use strict';
const { Queue, Worker } = require('bullmq');
const config = require('../config/appConfig');

const connection = {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
};

const schedulerQueue = new Queue('cms-scheduler', { connection });

// Worker processes scheduled-publish jobs
let worker = null;

function startSchedulerWorker() {
    worker = new Worker('cms-scheduler', async (job) => {
        // Lazy-require to avoid circular dependencies at module load time
        const { CmsContent, CmsWorkflow } = require('../models');
        const cache = require('./cacheService');
        const auditService = require('./auditService');

        const { contentId, websiteId } = job.data;

        const content = await CmsContent.findOne({ where: { id: contentId, websiteId } });
        if (!content || content.status !== 'scheduled') return;

        const workflow = await CmsWorkflow.findOne({ where: { contentId } });
        if (!workflow) return;

        const now = new Date();
        await content.update({ status: 'published', publishedAt: now });
        await workflow.update({ currentState: 'published', publishedAt: now, scheduleJobId: null });
        await cache.del(cache.keys.content(contentId));

        await auditService.logWorkflowAction({
            workflowId: workflow.id, contentId,
            actorId: content.authorId, action: 'publish',
            fromState: 'scheduled', toState: 'published',
            notes: 'Auto-published by scheduler',
        });

        console.log(`[Scheduler] Published content ${contentId}`);
    }, { connection });

    worker.on('failed', (job, err) => console.error(`[Scheduler] Job ${job?.id} failed:`, err.message));
    worker.on('completed', (job) => console.log(`[Scheduler] Job ${job.id} completed`));
}

async function scheduleContentPublish(contentId, websiteId, scheduledAt) {
    const delay = new Date(scheduledAt).getTime() - Date.now();
    if (delay <= 0) throw new Error('scheduledAt must be in the future');

    const job = await schedulerQueue.add('publish', { contentId, websiteId }, { delay, jobId: `publish:${contentId}`, removeOnComplete: true, removeOnFail: false });
    return job.id;
}

async function cancelScheduledPublish(contentId) {
    const job = await schedulerQueue.getJob(`publish:${contentId}`);
    if (job) await job.remove();
}

module.exports = { schedulerQueue, startSchedulerWorker, scheduleContentPublish, cancelScheduledPublish };
