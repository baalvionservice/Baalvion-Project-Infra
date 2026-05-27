const dotenv = require('dotenv');
dotenv.config();

const parseList = (value, fallback = []) => {
    if (!value) return fallback;
    return value.split(',').map(s => s.trim()).filter(Boolean);
};

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3012),
    apiVersion: 'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, [
        'http://localhost:3000',
        'http://localhost:3030',
        'http://localhost:5173',
    ]),
    jwt: {
        accessSecret: require('@baalvion/auth-node').requireEnv('JWT_ACCESS_SECRET'),
    },
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        name: process.env.DB_NAME || 'baalvion_db',
        user: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || '',
        schema: 'commerce',
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || undefined,
    },
    cache: {
        storeTtl: Number(process.env.CACHE_STORE_TTL || 300),        // 5 min
        productTtl: Number(process.env.CACHE_PRODUCT_TTL || 300),    // 5 min
        categoryTtl: Number(process.env.CACHE_CATEGORY_TTL || 1800), // 30 min
        collectionTtl: Number(process.env.CACHE_COLLECTION_TTL || 600), // 10 min
    },
    security: {
        ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 200),
    },
};
