const dotenv = require('dotenv');

dotenv.config();

const parseList = (value, fallback = []) => {
    if (!value) {
        return fallback;
    }

    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
};

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 4000),
    apiVersion: 'v1',
    baseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:5173']),
    refreshCookieName: process.env.REFRESH_COOKIE_NAME || 'baalvion_refresh',
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'replace-with-strong-access-secret',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'replace-with-strong-refresh-secret',
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    security: {
        bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
        ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 120),
        userRateLimit: Number(process.env.RATE_LIMIT_USER_MAX || 240),
    },
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
        priceDefaultCurrency: process.env.BILLING_CURRENCY || 'usd',
    },
    redis: {
        url: process.env.REDIS_URL || '',
    },
    websocket: {
        path: '/v1/ws',
    },
};