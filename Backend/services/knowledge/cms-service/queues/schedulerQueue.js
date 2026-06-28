'use strict';
const { Queue, Worker } = require('bullmq');
const config = require('../config/appConfig');
const { logger } = require('../platform/logger');
const { emitSafe, CmsEvents } = require('../platform/events');

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
        const { CmsContent, CmsWorkflow, CmsWebsite } = require('../models');
        const cache = require('../service/cacheService');
        const auditService = require('../service/auditService');
        const revalidateService = require('../service/revalidateService');

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

        // Domain event: same cms.content.published the manual publish path emits,
        // so analytics / cache-bust consumers react identically to scheduled posts.
        const website = await CmsWebsite.findByPk(websiteId, { attributes: ['slug', 'domain'] });
        const websiteSlug = website ? website.slug : null;
        emitSafe(CmsEvents.CONTENT_PUBLISHED, {
            websiteId, websiteSlug, contentId,
            slug: content.slug, contentType: content.contentType ?? null,
            trigger: 'scheduler',
        }, { tenantId: websiteSlug });

        // Bust the public delivery cache + revalidate the frontend so the
        // auto-published post goes live exactly like a manual publish.
        if (websiteSlug) {
            try { await cache.delPattern(`cms:public:${websiteSlug}:*`); } catch { /* fail-open */ }
            try {
                const { paths, urls } = revalidateService.pathsForContent(content, website && website.domain);
                revalidateService.dispatch(websiteSlug, { paths, urls });
            } catch { /* fail-open */ }
        }

        // SEO indexing trigger: notify search engines immediately on auto-publish too.
        try { require('../service/seoPingService').pingForWebsite(website); } catch { /* fail-open */ }

        logger('scheduler').info({ contentId, websiteSlug }, 'auto-published scheduled content');
    }, { connection });

    worker.on('failed', (job, err) => logger('scheduler').error({ jobId: job && job.id, err: err && err.message }, 'scheduler job failed'));
    worker.on('completed', (job) => logger('scheduler').debug({ jobId: job.id }, 'scheduler job completed'));
}

async function scheduleContentPublish(contentId, websiteId, scheduledAt) {
    const delay = new Date(scheduledAt).getTime() - Date.now();
    if (delay <= 0) throw new Error('scheduledAt must be in the future');

    // NOTE: BullMQ v5 forbids ':' in a custom jobId — use '-' as the separator.
    const job = await schedulerQueue.add('publish', { contentId, websiteId }, { delay, jobId: `publish-${contentId}`, removeOnComplete: true, removeOnFail: false });
    return job.id;
}

async function cancelScheduledPublish(contentId) {
    const job = await schedulerQueue.getJob(`publish-${contentId}`);
    if (job) await job.remove();
}

module.exports = { schedulerQueue, startSchedulerWorker, scheduleContentPublish, cancelScheduledPublish };
