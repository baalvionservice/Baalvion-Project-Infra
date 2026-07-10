'use strict';
const { Queue, Worker } = require('bullmq');
const { newQueueConnection } = require('../config/redisClient');
const config = require('../config/appConfig');
const db = require('../models');
const { collectFromSource } = require('../collectors/feedCollector');

const QUEUE_NAME = 'news-ingestion';
const REPEAT_JOB_NAME = 'poll-due-sources';

async function pollDueSources() {
    const sources = await db.Source.findAll({ where: { is_active: true } });
    const due = sources.filter((source) => {
        if (!source.last_polled_at) return true;
        const dueAt = new Date(source.last_polled_at.getTime() + source.poll_interval_minutes * 60_000);
        return dueAt <= new Date();
    });

    const results = [];
    for (const source of due) {
        try {
            results.push(await collectFromSource(source));
        } catch (err) {
            console.error(`[news-service] ingestion failed for source ${source.id} (${source.name}):`, err.message);
        }
    }
    return results;
}

function startIngestionWorker() {
    const queue = new Queue(QUEUE_NAME, { connection: newQueueConnection() });

    queue.upsertJobScheduler(
        REPEAT_JOB_NAME,
        { every: config.ingestion.pollIntervalCronMs },
        { name: REPEAT_JOB_NAME, opts: { removeOnComplete: { count: 20 }, removeOnFail: { count: 20 } } }
    ).catch((err) => console.error('[news-service] failed to schedule ingestion job:', err.message));

    const worker = new Worker(
        QUEUE_NAME,
        async () => pollDueSources(),
        { connection: newQueueConnection(), concurrency: 1 }
    );

    worker.on('completed', (job, result) => {
        const created = (result || []).reduce((sum, r) => sum + r.created, 0);
        if (created > 0) console.log(`[news-service] ingestion cycle: +${created} new articles`);
    });
    worker.on('failed', (job, err) => {
        console.error('[news-service] ingestion job failed:', err.message);
    });

    return { queue, worker };
}

module.exports = { startIngestionWorker, pollDueSources };
