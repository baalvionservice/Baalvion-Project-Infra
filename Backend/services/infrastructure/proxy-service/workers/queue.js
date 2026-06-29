'use strict';

/**
 * BullMQ Queue definitions.
 *
 * Reads REDIS_URL from the environment; falls back to redis://localhost:6379.
 * bullmq is listed in devDependencies (already present in package.json).
 */

const { Queue } = require('bullmq');

const connection = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
};

// Shared queue options
const defaultQueueOptions = {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 1000 },
    },
};

// NOTE: there is no `emails` queue — transactional email is sent synchronously through the
// centralized @baalvion/email (Amazon SES) service, not via a background worker.
const notificationQueue = new Queue('notifications', defaultQueueOptions);
const analyticsQueue    = new Queue('analytics',     defaultQueueOptions);

module.exports = {
    notificationQueue,
    analyticsQueue,
};
