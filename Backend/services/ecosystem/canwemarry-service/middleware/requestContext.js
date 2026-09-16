'use strict';
const { randomUUID } = require('node:crypto');

// Stamp every request with an id so a response, an audit row and a log line can be
// correlated after the fact without any of them carrying user data.
module.exports = (req, res, next) => {
    req.requestId = req.headers['x-request-id'] || randomUUID();
    req.startTime = Date.now();
    res.setHeader('x-request-id', req.requestId);
    next();
};
