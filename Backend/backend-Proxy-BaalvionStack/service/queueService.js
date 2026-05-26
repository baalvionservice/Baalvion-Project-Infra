const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const config = require('../config/appConfig');

let connection = null;
let queues = null;

const initializeQueues = async () => {
    if (!config.redis.url) {
        return null;
    }

    if (queues) {
        return queues;
    }

    connection = new IORedis(config.redis.url, { maxRetriesPerRequest: null });
    queues = {
        providerHealth: new Queue('provider-health', { connection }),
        usageAggregation: new Queue('usage-aggregation', { connection }),
        capacitySync: new Queue('provider-capacity', { connection }),
        reporting: new Queue('usage-reporting', { connection }),
        trialNotifications: new Queue('trial-notifications', { connection }),
        billingRenewals: new Queue('billing-renewals', { connection }),
    };

    return queues;
};

module.exports = {
    initializeQueues,
};