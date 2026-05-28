'use strict';
const { v4: uuidv4 } = require('uuid');

// Stamp every request with an id for tracing / error correlation.
module.exports = (req, res, next) => {
    req.requestId = req.headers['x-request-id'] || uuidv4();
    res.setHeader('x-request-id', req.requestId);
    next();
};
