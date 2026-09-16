'use strict';

/**
 * The daily newsroom run.
 *
 * One repeatable job walks every website that has an active editorial charter
 * and runs intake → cluster → brief → draft → gate for it. Sites without a
 * charter are not enumerated at all: the charter is what switches a desk on, and
 * a scheduler that fanned out across the whole estate would be exactly the
 * accident that rule exists to prevent.
 *
 * It stops at gated drafts. Nothing here publishes -- `gateService.approveDraft`
 * is the only path to a live article and it is called by a person. Auto-publish
 * on the publication policy is a separate decision that this job deliberately
 * does not act on.
 *
 * How far it runs is set by EDITORIAL_STOP_AFTER, and the default is 'cluster'
 * rather than a full pass. Stages 1-2 are deterministic and free; 3-4 spend model
 * credits per story. While a site is waiting on AdSense approval it must not
 * publish at volume anyway, and a news draft is unusable a week after it is
 * written (intakeService.MAX_AGE_HOURS), so drafting nightly would buy a queue of
 * articles that expire before anyone may publish them. Running to 'cluster'
 * keeps the signal queue warm and the desk provably working at no cost; set
 * EDITORIAL_STOP_AFTER=gate once the site is clear to publish.
 *
 * Gated by EDITORIAL_SCHEDULER: unset or 'false' means the run never registers,
 * so a developer machine and a CI box do not quietly start spending model
 * credits against the shared Redis.
 */

const { Queue, Worker } = require('bullmq');
const config = require('../config/appConfig');
const { logger } = require('../platform/logger');

const log = logger('editorial-scheduler');

const QUEUE_NAME = 'editorial-daily';
const JOB_ID = 'editorial-daily-run';

// 06:20 UTC by default: before the US market day window opens (12:00 UTC on
// Imperialpedia's policy) so a desk has drafts waiting when someone sits down,
// and off the hour to avoid every cron on the box firing together.
const DEFAULT_CRON = '20 6 * * *';

const connection = {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
};

const enabled = () => process.env.EDITORIAL_SCHEDULER === 'true';

let queue = null;
let worker = null;

function getQueue() {
    if (!queue) queue = new Queue(QUEUE_NAME, { connection });
    return queue;
}

// Stages 1-2 only by default — see the note at the top of this file.
const DEFAULT_STOP_AFTER = 'cluster';

/**
 * Runs one pass for every charter-bearing site.
 *
 * Sites are processed in series rather than in parallel: each one issues model
 * calls against a key the site owner pays for, and a burst across desks buys
 * nothing but a rate-limit.
 */
async function runDailyPass({ briefLimit, draftLimit, stopAfter } = {}) {
    // Required lazily so the module can be loaded (and the scheduler registered)
    // without pulling the whole model graph into a process that only enqueues.
    const { CmsEditorialCharter, CmsWebsite } = require('../models');
    const pipelineService = require('../service/editorial/pipelineService');

    const charters = await CmsEditorialCharter.findAll({
        where: { status: 'active' },
        attributes: ['websiteId'],
        raw: true,
    });

    if (!charters.length) {
        log.info('no active charters — nothing to run');
        return { desks: 0, runs: [] };
    }

    const runs = [];
    for (const { websiteId } of charters) {
        const site = await CmsWebsite.findByPk(websiteId, { attributes: ['id', 'slug'] });
        const slug = site ? site.slug : websiteId;
        try {
            const stage = stopAfter || process.env.EDITORIAL_STOP_AFTER || DEFAULT_STOP_AFTER;
            const result = await pipelineService.runPipeline(websiteId, {
                briefLimit: Number(briefLimit) || Number(process.env.EDITORIAL_BRIEF_LIMIT) || 12,
                draftLimit: Number(draftLimit) || Number(process.env.EDITORIAL_DRAFT_LIMIT) || 8,
                // 'gate' runs the whole pipeline; anything earlier stops there.
                stopAfter: stage === 'gate' ? null : stage,
            });
            runs.push({
                site: slug,
                ok: result.ok,
                stoppedAfter: stage,
                blocked: result.preflight.problems.map((p) => p.code),
                briefs: result.stages.brief && result.stages.brief.ready,
                drafts: result.stages.draft && result.stages.draft.drafted,
                gatesPassed: result.stages.gate && result.stages.gate.passed,
            });
            log.info({ site: slug, stages: result.stages }, 'desk run complete');
        } catch (err) {
            runs.push({ site: slug, ok: false, error: err.message });
            // One desk failing must not stop the others -- they are independent
            // publications with independent keys and independent wires.
            log.error({ site: slug, err: err.message }, 'desk run failed');
        }
    }

    return { desks: charters.length, runs };
}

function startEditorialWorker() {
    if (!enabled()) {
        log.info('EDITORIAL_SCHEDULER is not "true" — daily newsroom run disabled');
        return null;
    }
    if (worker) return worker;

    worker = new Worker(
        QUEUE_NAME,
        async (job) => runDailyPass(job.data || {}),
        // One at a time: the pass is already serial across desks, and two
        // overlapping passes would double-draft the same briefs.
        { connection, concurrency: 1 },
    );

    worker.on('failed', (job, err) => log.error({ jobId: job && job.id, err: err && err.message }, 'daily run failed'));
    worker.on('completed', (job, result) => log.info({ jobId: job.id, result }, 'daily run finished'));
    return worker;
}

async function scheduleEditorialJobs() {
    if (!enabled()) return;
    try {
        await getQueue().add(
            'daily',
            {},
            {
                repeat: { pattern: process.env.EDITORIAL_CRON || DEFAULT_CRON },
                jobId: JOB_ID,
                removeOnComplete: 30,
                removeOnFail: 30,
            },
        );
        log.info({
            cron: process.env.EDITORIAL_CRON || DEFAULT_CRON,
            stopAfter: process.env.EDITORIAL_STOP_AFTER || DEFAULT_STOP_AFTER,
        }, 'daily newsroom run scheduled');
    } catch (err) {
        // Fail-open, same as the analytics scheduler: a Redis blip at boot must
        // not stop the service listening.
        log.warn({ err: err && err.message }, 'failed to schedule the daily newsroom run');
    }
}

async function stopEditorialWorker() {
    if (worker) { await worker.close(); worker = null; }
    if (queue) { await queue.close(); queue = null; }
}

module.exports = {
    QUEUE_NAME, DEFAULT_CRON, DEFAULT_STOP_AFTER,
    runDailyPass, startEditorialWorker, scheduleEditorialJobs, stopEditorialWorker,
};
