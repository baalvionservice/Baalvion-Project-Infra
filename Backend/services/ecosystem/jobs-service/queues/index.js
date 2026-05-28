'use strict';
const { Queue } = require('bullmq');
const redisConnection = require('../config/redis');

const defaultJobOptions = {
    removeOnComplete: { count: 500 },
    removeOnFail:     { count: 200 },
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
};

const emailQueue     = new Queue('jobs-email-notifications', { connection: redisConnection, defaultJobOptions });
const scoringQueue   = new Queue('jobs-candidate-scoring',   { connection: redisConnection, defaultJobOptions });
const indexingQueue  = new Queue('jobs-seo-indexing',        { connection: redisConnection, defaultJobOptions });
const resumeQueue    = new Queue('jobs-resume-parsing',      { connection: redisConnection, defaultJobOptions });

// ── Queue helper functions ────────────────────────────────────────────────────

async function enqueueEmail(type, payload) {
    return emailQueue.add(type, payload, { priority: 1 });
}

async function enqueueScoring(applicationId, jobId, candidateId) {
    return scoringQueue.add('score-candidate', { applicationId, jobId, candidateId });
}

async function enqueueIndexing(jobId, action = 'upsert') {
    return indexingQueue.add(action, { jobId });
}

async function enqueueResumeParse(applicationId, resumeUrl) {
    return resumeQueue.add('parse-resume', { applicationId, resumeUrl });
}

module.exports = {
    emailQueue, scoringQueue, indexingQueue, resumeQueue,
    enqueueEmail, enqueueScoring, enqueueIndexing, enqueueResumeParse,
};
