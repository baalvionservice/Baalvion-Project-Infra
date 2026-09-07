'use strict';
const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino({
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    base: { service: 'auth-service' },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(isDev && {
        transport: {
            target: 'pino/file',
            options: { destination: 1 }, // stdout
        },
    }),
    redact: {
        paths: [
            'password', 'passwordHash', 'token', 'refreshToken',
            'req.headers.authorization', 'req.headers.cookie',
            // Set-Cookie carries the refresh token. Redacted here as well as omitted by the
            // serialisers, so widening a serialiser later cannot silently reintroduce the leak.
            'res.headers["set-cookie"]', 'res.headers.set-cookie',
            'body.password', 'body.refreshToken', 'body.newPassword',
        ],
        censor: '[REDACTED]',
    },
    serializers: {
        req: (req) => ({
            id:     req.id,
            method: req.method,
            url:    req.url,
            ip:     req.remoteAddress,
        }),
        res: (res) => ({
            statusCode: res.statusCode,
        }),
        err: pino.stdSerializers.err,
    },
});

module.exports = logger;
