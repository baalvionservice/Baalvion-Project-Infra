'use strict';
const dotenv = require('dotenv');
dotenv.config();

const parseList = (v, fb = []) => (!v ? fb : v.split(',').map((s) => s.trim()).filter(Boolean));

module.exports = {
    env:         process.env.NODE_ENV || 'development',
    port:        Number(process.env.PORT || 3032),
    apiVersion:  'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000', 'http://localhost:3030', 'http://localhost:8080']),

    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-insecure-audit-secret',
        issuer:       process.env.JWT_ISSUER   || 'baalvion-auth',
        audience:     process.env.JWT_AUDIENCE || 'baalvion-platform',
    },

    // Shared secret for service-to-service audit writes (PEP → POST /v1/audit).
    internalApiKey: process.env.INTERNAL_API_KEY || '',

    db: {
        host:     process.env.DB_HOST     || 'localhost',
        port:     Number(process.env.DB_PORT || 5432),
        name:     process.env.DB_NAME     || 'baalvion_db',
        user:     process.env.DB_USER     || 'baalvion',
        password: process.env.DB_PASSWORD || '',
        schema:   process.env.DB_SCHEMA   || 'audit',
    },

    redis: {
        host:     process.env.REDIS_HOST     || 'localhost',
        port:     Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || '',
    },

    // Redis-Streams event bus — auto-capture every domain event into the audit log.
    eventBus: {
        enabled:       (process.env.AUDIT_CONSUME_EVENTS || 'true') === 'true',
        stream:        process.env.EVENT_BUS_STREAM || 'baalvion:events',
        consumerGroup: 'audit-service',
        consumerName:  `audit-${process.env.POD_NAME || 'local'}`,
        batchSize:     Number(process.env.EVENT_BATCH_SIZE || 20),
        blockMs:       Number(process.env.EVENT_BLOCK_MS   || 2000),
    },
};
