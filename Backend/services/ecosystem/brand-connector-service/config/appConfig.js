const dotenv = require('dotenv');
dotenv.config();

const parseList = (value, fallback = []) => {
    if (!value) return fallback;
    return value.split(',').map(s => s.trim()).filter(Boolean);
};

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3006),
    apiVersion: 'v1',
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3006',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000', 'http://localhost:5173']),
    jwt: {
        accessSecret: require('@baalvion/auth-node').requireEnv('JWT_ACCESS_SECRET'),
        refreshSecret: require('@baalvion/auth-node').requireEnv('JWT_REFRESH_SECRET'),
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        name: process.env.DB_NAME || 'baalvion_db',
        user: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || '',
    },
    security: {
        ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 120),
    },
};
