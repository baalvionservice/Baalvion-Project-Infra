const dotenv = require('dotenv');
dotenv.config();
const parseList = (v, f = []) => v ? v.split(',').map(s => s.trim()).filter(Boolean) : f;
module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3004),
    apiVersion: 'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000']),
    jwt: { accessSecret: require('@baalvion/auth-node').requireEnv('JWT_ACCESS_SECRET') },
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        name: process.env.DB_NAME || 'baalvion_db',
        user: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || '',
    },
    security: { ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 120) },
};
