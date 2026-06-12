'use strict';
const dotenv = require('dotenv');
dotenv.config();

const parseList = (v, f = []) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : f);

module.exports = {
    service: process.env.SERVICE_NAME || 'network-graph-service',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3047),
    apiVersion: 'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000']),
    neo4j: {
        uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
        user: process.env.NEO4J_USER || 'neo4j',
        password: process.env.NEO4J_PASSWORD || 'neo4j_dev_password',
        database: process.env.NEO4J_DATABASE || 'neo4j',
        maxConnectionPoolSize: Number(process.env.NEO4J_POOL || 50),
    },
    security: { ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 120) },
    eventBus: {
        transport: process.env.EVENT_TRANSPORT || 'redis',
        stream: process.env.EVENT_STREAM || 'baalvion:events',
        consumerGroup: process.env.EVENT_CONSUMER_GROUP || 'network-graph-service',
    },
    cmsBaseUrl: process.env.CMS_BASE_URL || 'http://localhost:3011',
    internalSecret: process.env.INTERNAL_SERVICE_SECRET || 'dev_internal_secret',
    logLevel: process.env.LOG_LEVEL || 'info',
    startEventConsumer: process.env.EVENT_CONSUMER !== 'false',
};
