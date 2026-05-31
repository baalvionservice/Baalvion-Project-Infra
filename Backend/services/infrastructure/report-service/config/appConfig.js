'use strict';
const dotenv = require('dotenv');
dotenv.config();

const parseList = (v, fb = []) => (!v ? fb : v.split(',').map((s) => s.trim()).filter(Boolean));

module.exports = {
    env:         process.env.NODE_ENV || 'development',
    port:        Number(process.env.PORT || 3041),
    apiVersion:  'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000', 'http://localhost:3030', 'http://localhost:8080']),

    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-insecure-report-secret',
        issuer:       process.env.JWT_ISSUER   || 'baalvion-auth',
        audience:     process.env.JWT_AUDIENCE || 'baalvion-platform',
    },

    // Shared secret for service-to-service report runs (PEP → POST /v1/reports/:id/run).
    internalApiKey: process.env.INTERNAL_API_KEY || '',

    db: {
        host:     process.env.DB_HOST     || 'localhost',
        port:     Number(process.env.DB_PORT || 5432),
        name:     process.env.DB_NAME     || 'baalvion_db',
        user:     process.env.DB_USER     || 'baalvion',
        password: process.env.DB_PASSWORD || '',
        schema:   process.env.DB_SCHEMA   || 'reports',
    },

    redis: {
        host:     process.env.REDIS_HOST     || 'localhost',
        port:     Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || '',
    },

    reports: {
        // Read-only datasources a report definition may target, by key. The default
        // is the platform DB (queries run in a READ ONLY transaction regardless).
        datasources: (() => {
            const out = { default: process.env.REPORT_DEFAULT_DSN || process.env.DATABASE_URL || '' };
            // Extra DSNs declared as REPORT_DSN_<KEY>=postgres://...
            for (const [k, v] of Object.entries(process.env)) {
                const m = k.match(/^REPORT_DSN_(.+)$/);
                if (m && v) out[m[1].toLowerCase()] = v;
            }
            return out;
        })(),
        maxRows:     Number(process.env.REPORT_MAX_ROWS || 100000),
        statementTimeoutMs: Number(process.env.REPORT_STATEMENT_TIMEOUT_MS || 30000),
        schedulerEnabled:   (process.env.REPORT_SCHEDULER || 'true') === 'true',
        schedulerTickMs:    Number(process.env.REPORT_SCHEDULER_TICK_MS || 60000),
    },
};
