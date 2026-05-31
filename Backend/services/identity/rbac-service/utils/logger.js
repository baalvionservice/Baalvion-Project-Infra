'use strict';
const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino({
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    base: { service: 'rbac-service' },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(isDev && {
        transport: { target: 'pino/file', options: { destination: 1 } },
    }),
    redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'token'],
        censor: '[REDACTED]',
    },
    serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url, ip: req.remoteAddress }),
        res: (res) => ({ statusCode: res.statusCode }),
        err: pino.stdSerializers.err,
    },
});

module.exports = logger;
