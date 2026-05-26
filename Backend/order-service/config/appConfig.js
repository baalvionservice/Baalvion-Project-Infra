const dotenv = require('dotenv');
dotenv.config();

const parseList = (value, fallback = []) => {
    if (!value) return fallback;
    return value.split(',').map(s => s.trim()).filter(Boolean);
};

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3013),
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000', 'http://localhost:3030', 'http://localhost:5173']),
    jwt: { accessSecret: process.env.JWT_ACCESS_SECRET || 'replace-with-strong-access-secret' },
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        name: process.env.DB_NAME || 'baalvion_db',
        user: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || '',
        schema: 'orders',
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || undefined,
    },
    cache: {
        orderTtl: Number(process.env.CACHE_ORDER_TTL || 120),
        customerTtl: Number(process.env.CACHE_CUSTOMER_TTL || 300),
        cartTtl: Number(process.env.CACHE_CART_TTL || 1800),
    },
    security: { ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 200) },
};
