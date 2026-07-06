'use strict';
/**
 * Unified Analytics Platform — workers + repeatable scheduler.
 *
 * Gated by the ANALYTICS_WORKERS env flag (default on) so the same image runs
 * either as an API replica (workers off) or a dedicated worker replica. Each
 * processor lazy-requires its service to avoid load-time circular deps, exactly
 * like the existing scheduler/notification workers.
 */
const { Worker } = require('bullmq');
const { logger } = require('../platform/logger');
const { QUEUE, connection, enqueueRollup, enqueueMaintenance, deadLetter, q } = require('./analyticsQueue');

const CONCURRENCY = {
    [QUEUE.INGEST]: Number(process.env.ANALYTICS_INGEST_CONCURRENCY || 12),
    [QUEUE.SYNC]: Number(process.env.ANALYTICS_SYNC_CONCURRENCY || 4),
    [QUEUE.ROLLUP]: Number(process.env.ANALYTICS_ROLLUP_CONCURRENCY || 2),
    [QUEUE.MAINTENANCE]: 1,
};

const PROCESSORS = {
    [QUEUE.INGEST]: async (job) => {
        const eventService = require('../service/analytics/eventService');
        return eventService.persist(job.data);
    },
    [QUEUE.SYNC]: async (job) => {
        const connectorRunner = require('../connectors');
        return connectorRunner.runSync(job.data);
    },
    [QUEUE.ROLLUP]: async (job) => {
        const rollupService = require('../service/analytics/rollupService');
        return rollupService.runRollup(job.data);
    },
    [QUEUE.MAINTENANCE]: async (job) => {
        const retentionService = require('../service/analytics/retentionService');
        return retentionService.runMaintenance(job.data);
    },
};

let workers = [];

function startAnalyticsWorkers() {
    if (process.env.ANALYTICS_WORKERS === 'false') {
        logger('analytics').info('ANALYTICS_WORKERS=false — analytics workers disabled on this replica');
        return;
    }
    if (workers.length) return; // idempotent

    for (const [name, processor] of Object.entries(PROCESSORS)) {
        const worker = new Worker(name, processor, { connection, concurrency: CONCURRENCY[name] || 1 });
        worker.on('failed', async (job, err) => {
            logger('analytics').error({ queue: name, jobId: job && job.id, err: err && err.message }, 'analytics job failed');
            // Exhausted retries → dead-letter for inspection/replay.
            if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
                await deadLetter(name, job, err && err.message);
            }
        });
        worker.on('error', (err) => logger('analytics').warn({ queue: name, err: err && err.message }, 'analytics worker error (fail-open)'));
        workers.push(worker);
    }
    logger('analytics').info({ queues: Object.keys(PROCESSORS) }, 'analytics workers started');
}

async function stopAnalyticsWorkers() {
    await Promise.allSettled(workers.map((w) => w.close()));
    workers = [];
}

/**
 * Register the platform's repeatable jobs. Idempotent — BullMQ dedupes a
 * repeatable by its (name, pattern, jobId), so calling this on every boot is safe.
 * Provider sync repeatables are added dynamically per website+provider once a
 * connector is configured (see scheduleProviderSync), so none are registered here.
 */
async function scheduleAnalyticsJobs() {
    if (process.env.ANALYTICS_WORKERS === 'false') return;
    try {
        // Hourly incremental rollup of the recent window (today + yesterday, to
        // absorb late-arriving events) — cheap and keeps the dashboard fresh.
        await enqueueRollup(
            { type: 'daily', target: 'recent' },
            { repeat: { pattern: process.env.ANALYTICS_ROLLUP_CRON || '0 * * * *' }, jobId: 'analytics-rollup-hourly', removeOnComplete: 50, removeOnFail: 50 },
        );
        // Nightly maintenance: ensure upcoming partitions + retention sweep.
        await enqueueMaintenance(
            { task: 'daily' },
            { repeat: { pattern: process.env.ANALYTICS_MAINTENANCE_CRON || '15 3 * * *' }, jobId: 'analytics-maintenance-daily', removeOnComplete: 20, removeOnFail: 20 },
        );
        logger('analytics').info('analytics repeatable jobs scheduled');
    } catch (err) {
        // Fail-open: a Redis blip at boot must not stop the service from listening.
        logger('analytics').warn({ err: err && err.message }, 'failed to schedule analytics repeatable jobs');
    }
}

/**
 * Upsert a per-(website,provider) repeatable sync. Called when a connector is
 * enabled for a website; the fixed jobId makes re-registration idempotent.
 */
async function scheduleProviderSync(websiteId, provider, pattern) {
    const { enqueueSync } = require('./analyticsQueue');
    return enqueueSync(
        { websiteId, provider, window: 'incremental' },
        { repeat: { pattern }, jobId: `analytics-sync-${websiteId}-${provider}`, removeOnComplete: 50, removeOnFail: 50 },
    );
}

/** Remove a per-(website,provider) repeatable sync (connector disabled). */
async function unscheduleProviderSync(websiteId, provider) {
    try {
        const repeatables = await q(QUEUE.SYNC).getRepeatableJobs();
        const match = repeatables.find((r) => r.id === `analytics-sync-${websiteId}-${provider}`);
        if (match) await q(QUEUE.SYNC).removeRepeatableByKey(match.key);
    } catch (err) {
        logger('analytics').warn({ err: err && err.message, websiteId, provider }, 'failed to unschedule provider sync');
    }
}

module.exports = {
    startAnalyticsWorkers,
    stopAnalyticsWorkers,
    scheduleAnalyticsJobs,
    scheduleProviderSync,
    unscheduleProviderSync,
};
