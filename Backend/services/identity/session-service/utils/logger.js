'use strict';
const pino = require('pino');
module.exports = pino({
    level: process.env.LOG_LEVEL || 'info',
    ...(process.env.NODE_ENV !== 'production' && {
        transport: { target: 'pino-pretty', options: { colorize: true } },
    }),
    redact: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token', 'secret'],
    base: { service: 'session-service' },
});
