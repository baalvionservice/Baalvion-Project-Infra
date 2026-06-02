'use strict';
const dotenv = require('dotenv');
dotenv.config();

const parseList = (v, fb = []) => (!v ? fb : v.split(',').map((s) => s.trim()).filter(Boolean));

module.exports = {
    env:         process.env.NODE_ENV || 'development',
    port:        Number(process.env.PORT || 3042),
    apiVersion:  'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000', 'http://localhost:3030', 'http://localhost:8080']),

    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-insecure-developer-secret',
        issuer:       process.env.JWT_ISSUER   || 'baalvion-auth',
        audience:     process.env.JWT_AUDIENCE || 'baalvion-platform',
    },

    // Shared secret for service-to-service calls (e.g. the gateway verifying an API key).
    internalApiKey: process.env.INTERNAL_API_KEY || '',

    db: {
        host:     process.env.DB_HOST     || 'localhost',
        port:     Number(process.env.DB_PORT || 5432),
        name:     process.env.DB_NAME     || 'baalvion_db',
        user:     process.env.DB_USER     || 'baalvion',
        password: process.env.DB_PASSWORD || '',
        schema:   process.env.DB_SCHEMA   || 'developer',
    },

    redis: {
        host:     process.env.REDIS_HOST     || 'localhost',
        port:     Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || '',
    },

    apiKeys: {
        // bk_live_… / bk_test_… ; prefix length stored for lookup.
        livePrefix:  process.env.API_KEY_LIVE_PREFIX || 'bk_live_',
        testPrefix:  process.env.API_KEY_TEST_PREFIX || 'bk_test_',
        secretBytes: Number(process.env.API_KEY_SECRET_BYTES || 24),
    },

    webhooks: {
        deliveryEnabled: (process.env.WEBHOOK_DELIVERY || 'true') === 'true',
        tickMs:          Number(process.env.WEBHOOK_TICK_MS || 5000),
        maxAttempts:     Number(process.env.WEBHOOK_MAX_ATTEMPTS || 6),
        timeoutMs:       Number(process.env.WEBHOOK_TIMEOUT_MS || 8000),
        // exponential backoff schedule (seconds) per attempt
        backoffSec:      parseList(process.env.WEBHOOK_BACKOFF_SEC, ['10', '30', '120', '600', '1800', '7200']).map(Number),
        signatureHeader: process.env.WEBHOOK_SIGNATURE_HEADER || 'X-Baalvion-Signature',
    },

    eventBus: {
        stream:        process.env.EVENT_BUS_STREAM || 'baalvion:events',
        consume:       (process.env.DEVELOPER_CONSUME_EVENTS || 'true') === 'true',
        consumerGroup: 'developer-service',
        consumerName:  `developer-${process.env.POD_NAME || 'local'}`,
        batchSize:     Number(process.env.EVENT_BATCH_SIZE || 50),
        blockMs:       Number(process.env.EVENT_BLOCK_MS || 2000),
    },
};
