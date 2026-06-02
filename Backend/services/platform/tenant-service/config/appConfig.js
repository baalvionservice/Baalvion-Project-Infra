'use strict';
const dotenv = require('dotenv');
dotenv.config();

const parseList = (v, fb = []) => (!v ? fb : v.split(',').map((s) => s.trim()).filter(Boolean));

// Prod fail-fast: refuse to boot with a known-insecure dev secret or missing key.
const DEV_INSECURE_SECRET = 'dev-insecure-tenant-secret';
const _jwtAccessSecret = process.env.JWT_ACCESS_SECRET || DEV_INSECURE_SECRET;
const _nodeEnv = process.env.NODE_ENV || 'development';
if (_nodeEnv === 'production' && (!process.env.JWT_PUBLIC_KEY && _jwtAccessSecret === DEV_INSECURE_SECRET)) {
    // eslint-disable-next-line no-console
    console.error('[tenant-service] FATAL: JWT_ACCESS_SECRET / JWT_PUBLIC_KEY must be set in production');
    process.exit(1);
}

module.exports = {
    env:         _nodeEnv,
    port:        Number(process.env.PORT || 3043),
    apiVersion:  'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000', 'http://localhost:3030', 'http://localhost:8080']),

    jwt: {
        accessSecret: _jwtAccessSecret,
        issuer:       process.env.JWT_ISSUER   || 'baalvion-auth',
        audience:     process.env.JWT_AUDIENCE || 'baalvion-platform',
    },

    internalApiKey: process.env.INTERNAL_API_KEY || '',

    db: {
        host:     process.env.DB_HOST     || 'localhost',
        port:     Number(process.env.DB_PORT || 5432),
        name:     process.env.DB_NAME     || 'baalvion_db',
        user:     process.env.DB_USER     || 'baalvion',
        password: process.env.DB_PASSWORD || '',
        schema:   process.env.DB_SCHEMA   || 'tenant',
    },

    redis: {
        host:     process.env.REDIS_HOST     || 'localhost',
        port:     Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || '',
    },

    eventBus: { stream: process.env.EVENT_BUS_STREAM || 'baalvion:events' },

    tenant: {
        // DNS TXT prefix used to prove custom-domain ownership.
        domainVerifyPrefix: process.env.DOMAIN_VERIFY_PREFIX || 'baalvion-verify',
        // public branding resolve cache TTL (seconds)
        resolveCacheTtl: Number(process.env.RESOLVE_CACHE_TTL || 60),
    },
};
