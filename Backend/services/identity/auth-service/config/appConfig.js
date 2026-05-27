const dotenv = require('dotenv');
dotenv.config();

const parseList = (value, fallback = []) => {
    if (!value) return fallback;
    return value.split(',').map(s => s.trim()).filter(Boolean);
};

module.exports = {
    env:         process.env.NODE_ENV   || 'development',
    port:        Number(process.env.PORT || 3001),
    apiVersion:  'v1',
    baseUrl:     process.env.API_BASE_URL  || 'http://localhost:3001',
    frontendUrl: process.env.FRONTEND_URL  || 'http://localhost:8080',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080']),

    refreshCookieName: process.env.REFRESH_COOKIE_NAME || 'baalvion_refresh',

    jwt: {
        // RS256 keys loaded by config/vault.js — these secrets are only the HS256
        // fallback kept for backward-compat; new code uses jwtRsa.js exclusively.
        accessSecret:      require('@baalvion/auth-node').requireEnv('JWT_ACCESS_SECRET'),
        refreshSecret:     require('@baalvion/auth-node').requireEnv('JWT_REFRESH_SECRET'),
        accessExpiresIn:   process.env.JWT_ACCESS_EXPIRES_IN  || '15m',
        refreshExpiresIn:  process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer:            process.env.JWT_ISSUER   || 'baalvion-auth',
        audience:          process.env.JWT_AUDIENCE || 'baalvion-platform',
    },

    db: {
        host:     process.env.DB_HOST     || 'localhost',
        port:     Number(process.env.DB_PORT || 5432),
        name:     process.env.DB_NAME     || 'baalvion_db',
        user:     process.env.DB_USER     || 'baalvion',
        password: process.env.DB_PASSWORD || '',
    },

    redis: {
        host:     process.env.REDIS_HOST     || '',       // empty = disabled
        port:     Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || '',
        db:       Number(process.env.REDIS_DB   || 0),
    },

    security: {
        bcryptRounds:  Number(process.env.BCRYPT_ROUNDS       || 12),
        ipRateLimit:   Number(process.env.RATE_LIMIT_IP_MAX   || 20),
        emailRateLimit:Number(process.env.RATE_LIMIT_EMAIL_MAX || 10),
    },

    email: {
        from: process.env.EMAIL_FROM  || 'noreply@baalvion.com',
        host: process.env.SMTP_HOST   || '',
        port: Number(process.env.SMTP_PORT || 587),
        user: process.env.SMTP_USER   || '',
        pass: process.env.SMTP_PASS   || '',
    },

    eventBus: {
        stream: process.env.EVENT_BUS_STREAM || 'baalvion:events',
    },
};
