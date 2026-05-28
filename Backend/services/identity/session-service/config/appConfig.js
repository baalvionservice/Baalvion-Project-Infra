'use strict';
require('dotenv').config();

module.exports = {
    port: parseInt(process.env.PORT || '3022', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim()),

    db: {
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT || '5432', 10),
        name:     process.env.DB_NAME     || 'baalvion_db',
        user:     process.env.DB_USER     || 'baalvion',
        password: process.env.DB_PASSWORD || '',
    },

    redis: {
        host:     process.env.REDIS_HOST     || 'localhost',
        port:     parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
    },

    jwt: {
        publicKeyPath: process.env.JWT_PUBLIC_KEY_PATH || undefined,
        publicKeyB64:  process.env.JWT_PUBLIC_KEY_B64  || undefined,
        publicKey:     process.env.JWT_PUBLIC_KEY       || undefined,
        issuer:        process.env.JWT_ISSUER           || 'baalvion-auth',
        audience:      process.env.JWT_AUDIENCE         || 'baalvion',
    },

    // Risk thresholds
    risk: {
        impossibleTravelKmh: parseInt(process.env.IMPOSSIBLE_TRAVEL_KMH || '900', 10),
        highRiskScore:       parseInt(process.env.HIGH_RISK_SCORE        || '70',  10),
    },

    // Session TTL for Redis cache (seconds)
    sessionCacheTtl: parseInt(process.env.SESSION_CACHE_TTL || '300', 10),
};
