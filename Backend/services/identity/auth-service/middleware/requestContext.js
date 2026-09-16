'use strict';
const { v4: uuidv4 } = require('uuid');
const pinoHttp      = require('pino-http');
const logger        = require('../utils/logger');

// HTTP request/response logging via pino-http
const httpLogger = pinoHttp({
    logger,
    /*
     * Serialisers, stated explicitly.
     *
     * pino-http installs its OWN req/res serialisers, which override the ones the base logger
     * defines — and its defaults include the full header sets. `res.headers['set-cookie']`
     * therefore wrote the refresh-token JWT into the log on every register, login and refresh,
     * so anyone who could read the log held usable credentials.
     *
     * These mirror utils/logger.js: the method, the path, the status. No headers on either
     * side, so neither the incoming Authorization/Cookie nor the outgoing Set-Cookie can be
     * recorded by accident again.
     */
    serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url, ip: req.remoteAddress }),
        res: (res) => ({ statusCode: res.statusCode }),
    },
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
