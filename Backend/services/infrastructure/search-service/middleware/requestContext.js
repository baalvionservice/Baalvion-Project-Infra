'use strict';
const { v4: uuidv4 } = require('uuid');
const pinoHttp = require('pino-http');
const logger = require('../utils/logger');

const httpLogger = pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === '/health' },
    customLogLevel: (req, res, err) => (err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
    genReqId: () => uuidv4(),
});

module.exports = (req, res, next) => {
    req.requestId = uuidv4();
    res.set('X-Request-Id', req.requestId);
    httpLogger(req, res, next);
};
