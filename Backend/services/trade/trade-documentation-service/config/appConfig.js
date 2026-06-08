'use strict';
const dotenv = require('dotenv');
dotenv.config();
const parseList = (v, f = []) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : f);

module.exports = {
    service: process.env.SERVICE_NAME || 'trade-documentation-service',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3049),
    schema: process.env.DB_SCHEMA || 'tradedoc',
    apiVersion: 'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000']),
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        name: process.env.DB_NAME || 'baalvion_db',
        user: process.env.DB_USER || 'baalvion_app',
        password: process.env.DB_PASSWORD || '',
    },
    // F4: migrations run as the privileged OWNER role (not baalvion_app) so table
    // ownership + RLS DDL are correct and the app role stays subject to RLS.
    migration: {
        user: process.env.MIGRATION_DB_USER || process.env.DB_USER || 'baalvion_app',
        password: process.env.MIGRATION_DB_PASSWORD || process.env.DB_PASSWORD || '',
    },
    storage: {
        bucket: process.env.DOC_BUCKET || 'gtos-trade-docs',
        endpoint: process.env.S3_ENDPOINT || '',
    },
    productRegistryUrl: process.env.SVC_PRODUCT_REGISTRY || 'http://localhost:3048',
    security: { ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 120) },
    eventBus: {
        transport: process.env.EVENT_TRANSPORT || 'redis',
        stream: process.env.EVENT_STREAM || 'baalvion:events',
        consumerGroup: process.env.EVENT_CONSUMER_GROUP || 'trade-documentation-service',
    },
    cmsBaseUrl: process.env.CMS_BASE_URL || 'http://localhost:3011',
    internalSecret: process.env.INTERNAL_SERVICE_SECRET || 'dev_internal_secret',
    logLevel: process.env.LOG_LEVEL || 'info',
    bootstrapMigrations: process.env.BOOTSTRAP_MIGRATIONS !== 'false',
    startEventConsumer: process.env.EVENT_CONSUMER !== 'false',
};
