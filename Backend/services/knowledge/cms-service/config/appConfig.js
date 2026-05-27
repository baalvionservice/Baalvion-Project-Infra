const dotenv = require('dotenv');
dotenv.config();

const parseList = (value, fallback = []) => {
    if (!value) return fallback;
    return value.split(',').map(s => s.trim()).filter(Boolean);
};

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3011),
    apiVersion: 'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, [
        'http://localhost:3000',
        'http://localhost:3030',
        'http://localhost:5173',
    ]),
    jwt: {
        publicKey: require('@baalvion/auth-node').requireEnv('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
        issuer:    process.env.JWT_ISSUER   || 'baalvion-auth',
        audience:  process.env.JWT_AUDIENCE || 'baalvion-platform',
        jwksUri:   process.env.BAALVION_JWKS_URI || process.env.JWKS_URI || null,
    },
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        name: process.env.DB_NAME || 'baalvion_db',
        user: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || '',
        schema: 'cms',
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || undefined,
    },
    cache: {
        contentTtl: Number(process.env.CACHE_CONTENT_TTL || 300),   // 5 min
        publicTtl: Number(process.env.CACHE_PUBLIC_TTL || 600),     // 10 min
        taxonomyTtl: Number(process.env.CACHE_TAXONOMY_TTL || 1800), // 30 min
    },
    security: {
        ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 200),
    },
    media: {
        serviceUrl: process.env.MEDIA_SERVICE_URL || 'http://localhost:3012',
    },
    notifications: {
        serviceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3013',
    },
};
