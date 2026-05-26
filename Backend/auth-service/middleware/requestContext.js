'use strict';
const { v4: uuidv4 } = require('uuid');
const pinoHttp      = require('pino-http');
const logger        = require('../utils/logger');

// HTTP request/response logging via pino-http
const httpLogger = pinoHttp({
    logger,
    // Skip health-check noise in logs
    autoLogging: { ignore: (req) => req.url === '/health' },
    customLogLevel: (req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400)        return 'warn';
        return 'info';
    },
    customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage:   (req, res, err) => `${req.method} ${req.url} ${res.statusCode} — ${err.message}`,
    genReqId: () => uuidv4(),
});

module.exports = (req, res, next) => {
    req.requestId = uuidv4();
    req.startTime = Date.now();
    res.set('X-Request-Id', req.requestId);
    httpLogger(req, res, next);
};
