'use strict';
/**
 * Unified Analytics Platform — queue registry.
 *
 * Four queues coordinate the pipeline, plus a dead-letter queue for exhausted
 * jobs (inspect + replay). Mirrors the platform BullMQ conventions: exponential
 * backoff, idempotent jobIds, and fail-open Redis (a Redis blip must never crash
 * the API or the collector).
 *
 *   analytics-ingest       raw event → normalize → persist (high volume)
 *   analytics-sync         per-(website,provider) connector pull (external APIs)
 *   analytics-rollup       aggregate raw → daily/monthly rollups + MV refresh
 *   analytics-maintenance  partition create/drop + retention sweep
 */
const { Queue } = require('bullmq');
const config = require('../config/appConfig');
const { logger } = require('../platform/logger');

const connection = {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
};

const QUEUE = Object.freeze({
    INGEST: 'analytics-ingest',
    SYNC: 'analytics-sync',
    ROLLUP: 'analytics-rollup',
    MAINTENANCE: 'analytics-maintenance',
    DEAD_LETTER: 'analytics-dead-letter',
});

const DEFAULT_JOB_OPTS = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 500 },
    removeOnComplete: 1000,
    removeOnFail: false, // keep failed jobs for inspection; DLQ holds the replayable copy
};

// Lazily instantiate one Queue per name.
const _queues = new Map();
function q(name) {
    let queue = _queues.get(name);
    if (!queue) {
        queue = new Queue(name, { connection });
        queue.on('error', (err) => logger('analytics-queue').warn({ queue: name, err: err && err.message }, 'queue error (fail-open)'));
        _queues.set(name, queue);
    }
    return queue;
}

/** Enqueue a single normalized event for persistence. */
async function enqueueIngest(event, opts = {}) {
    // event_id doubles as the idempotency key so a retried beacon never double-writes.
    return q(QUEUE.INGEST).add('event', event, { jobId: event.eventId, ...DEFAULT_JOB_OPTS, ...opts });
}

/** Enqueue a batch of normalized events (beacon flush). */
async function enqueueIngestBatch(events, opts = {}) {
    if (!Array.isArray(events) || events.length === 0) return [];
    return q(QUEUE.INGEST).addBulk(
        events.map((event) => ({ name: 'event', data: event, opts: { jobId: event.eventId, ...DEFAULT_JOB_OPTS, ...opts } })),
    );
}

/** Enqueue a provider sync job for one website+provider window. */
async function enqueueSync(job, opts = {}) {
    return q(QUEUE.SYNC).add('sync', job, { ...DEFAULT_JOB_OPTS, ...opts });
}

/** Enqueue a rollup job (daily/monthly). */
async function enqueueRollup(job, opts = {}) {
    return q(QUEUE.ROLLUP).add('rollup', job, { ...DEFAULT_JOB_OPTS, ...opts });
}

/** Enqueue a maintenance job (partitions/retention). */
async function enqueueMaintenance(job, opts = {}) {
    return q(QUEUE.MAINTENANCE).add('maintenance', job, { ...DEFAULT_JOB_OPTS, ...opts });
}

/** Move a permanently-failed job onto the dead-letter queue for later replay. */
async function deadLetter(sourceQueue, job, reason) {
    try {
        await q(QUEUE.DEAD_LETTER).add('dead', {
            sourceQueue,
            name: job.name,
            data: job.data,
            reason,
            failedAttempts: job.attemptsMade,
        }, { removeOnComplete: false, removeOnFail: false });
    } catch (err) {
        logger('analytics-queue').error({ err: err && err.message }, 'failed to dead-letter job');
    }
}

/** Queue-depth snapshot for the health/metrics endpoints. */
async function health() {
    const out = {};
    for (const name of Object.values(QUEUE)) {
        try {
            out[name] = await q(name).getJobCounts('waiting', 'active', 'delayed', 'failed', 'completed');
        } catch (err) {
            out[name] = { error: err && err.message };
        }
    }
    return out;
}

async function closeQueues() {
    await Promise.allSettled([..._queues.values()].map((queue) => queue.close()));
    _queues.clear();
}

module.exports = {
    QUEUE,
    connection,
    DEFAULT_JOB_OPTS,
    q,
    enqueueIngest,
    enqueueIngestBatch,
    enqueueSync,
    enqueueRollup,
    enqueueMaintenance,
    deadLetter,
    health,
    closeQueues,
};
