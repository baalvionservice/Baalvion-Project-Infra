'use strict';
const { Queue, QueueEvents } = require('bullmq');
const redis  = require('../config/redis');
const config = require('../config/appConfig');
const logger = require('../utils/logger');

let emailQueue;
let webhookQueue;
let smsQueue;
let pushQueue;
let notificationQueue;

function getQueues() {
    if (emailQueue) return { emailQueue, webhookQueue, smsQueue, pushQueue, notificationQueue };

    const connection = redis.newConnection();

    emailQueue = new Queue(config.queues.email, {
        connection,
        defaultJobOptions: {
            attempts:  config.retry.email.attempts,
            backoff:   config.retry.email.backoff,
            removeOnComplete: { count: 500, age: 86400 },
            removeOnFail:     { count: 200, age: 604800 },
        },
    });

    webhookQueue = new Queue(config.queues.webhook, {
        connection,
        defaultJobOptions: {
            attempts: config.retry.webhook.attempts,
            backoff:  config.retry.webhook.backoff,
            removeOnComplete: { count: 200, age: 86400 },
            removeOnFail:     { count: 100, age: 604800 },
        },
    });

    smsQueue = new Queue(config.queues.sms, {
        connection,
        defaultJobOptions: {
            attempts: config.retry.sms.attempts,
            backoff:  config.retry.sms.backoff,
            removeOnComplete: { count: 300, age: 86400 },
            removeOnFail:     { count: 150, age: 604800 },
        },
    });

    pushQueue = new Queue(config.queues.push, {
        connection,
        defaultJobOptions: {
            attempts: config.retry.push.attempts,
            backoff:  config.retry.push.backoff,
            removeOnComplete: { count: 500, age: 86400 },
            removeOnFail:     { count: 200, age: 604800 },
        },
    });

    notificationQueue = new Queue(config.queues.notification, {
        connection,
        defaultJobOptions: {
            attempts: 3,
            backoff:  { type: 'exponential', delay: 3_000 },
            removeOnComplete: { count: 1000, age: 86400 },
            removeOnFail:     { count: 200,  age: 604800 },
        },
    });

    // Log queue failures
    const emailEvents = new QueueEvents(config.queues.email, { connection: redis.newConnection() });
    emailEvents.on('failed', ({ jobId, failedReason }) => {
        logger.error({ jobId, reason: failedReason }, 'Email job failed');
    });

    return { emailQueue, webhookQueue, smsQueue, pushQueue, notificationQueue };
}

module.exports = { getQueues };
