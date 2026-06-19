'use strict';
// Dedicated ioredis connection for BullMQ (requires maxRetriesPerRequest: null).
const IORedis = require('ioredis');

const opts = { maxRetriesPerRequest: null, enableReadyCheck: false };
const connection = process.env.REDIS_URL
    ? new IORedis(process.env.REDIS_URL, opts)
    : new IORedis({ host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379), ...opts });

connection.on('error', () => { /* surfaced via /v1/queues/health */ });

module.exports = connection;
