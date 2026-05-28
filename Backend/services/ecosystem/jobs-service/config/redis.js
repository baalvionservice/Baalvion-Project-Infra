'use strict';
require('dotenv').config();

const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
});

connection.on('error', (err) => {
    if (err.code !== 'ECONNREFUSED') {
        console.error('[Redis] Connection error:', err.message);
    }
});

connection.on('connect', () => console.log('[Redis] Connected'));

module.exports = connection;
