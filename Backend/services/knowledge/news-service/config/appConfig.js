const dotenv = require('dotenv');
dotenv.config();
const parseList = (v, f = []) => v ? v.split(',').map(s => s.trim()).filter(Boolean) : f;

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3045),
    apiVersion: 'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3070', 'http://localhost:3030']),
    // Internal admin auth (admin-platform → news-service /v1/admin/*). Verify-only RS256,
    // same shared-key pattern every sibling service uses (see imperialpedia-service/config/appConfig.js).
    jwt: {
        publicKey: (process.env.JWT_PUBLIC_KEY || '').replace(/\\n/g, '\n'),
        issuer: process.env.JWT_ISSUER || 'baalvion-auth',
        audience: process.env.JWT_AUDIENCE || 'baalvion-platform',
        jwksUri: process.env.JWKS_URI || null,
    },
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        name: process.env.DB_NAME || 'baalvion_db',
        user: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || '',
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    developerService: {
        baseUrl: process.env.DEVELOPER_SERVICE_URL || 'http://localhost:3042',
        internalApiKey: process.env.INTERNAL_API_KEY || '',
    },
    quota: {
        freeDailyLimit: Number(process.env.QUOTA_FREE_DAILY_LIMIT || 100),
        keyVerifyCacheTtlSeconds: Number(process.env.QUOTA_KEY_CACHE_TTL_SECONDS || 30),
    },
    ingestion: {
        pollIntervalCronMs: Number(process.env.INGESTION_POLL_INTERVAL_MS || 5 * 60 * 1000),
    },
    security: { ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 120) },
};
