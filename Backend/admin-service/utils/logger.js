'use strict';
const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino({
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    base: { service: 'admin-service' },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(isDev && { transport: { target: 'pino/file', options: { destination: 1 } } }),
    redact: {
        paths: ['token', 'req.headers.authorization', 'req.headers.cookie'],
        censor: '[REDACTED]',
    },
});

module.exports = logger;
