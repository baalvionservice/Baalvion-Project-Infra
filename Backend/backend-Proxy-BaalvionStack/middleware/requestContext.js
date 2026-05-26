const { v4: uuidv4 } = require('uuid');

const requestContext = (req, res, next) => {
    req.requestId = uuidv4();
    req.startTime = Date.now();
    res.setHeader('x-request-id', req.requestId);
    next();
};

module.exports = requestContext;