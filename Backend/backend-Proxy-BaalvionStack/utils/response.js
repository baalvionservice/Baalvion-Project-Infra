const { v4: uuidv4 } = require('uuid');

const buildMeta = (req, extra = {}) => ({
    requestId: req.requestId || uuidv4(),
    timestamp: new Date().toISOString(),
    latency: req.startTime ? Date.now() - req.startTime : 0,
    version: 'v1',
    ...extra,
});

const sendSuccess = (req, res, data, status = 200, meta = {}) => {
    res.status(status).json({
        success: true,
        data,
        meta: buildMeta(req, meta),
    });
};

const sendPaginated = (req, res, payload, status = 200) => {
    res.status(status).json({
        success: true,
        data: payload,
        meta: buildMeta(req),
    });
};

const sendError = (req, res, error) => {
    const status = error.statusCode || 500;
    res.status(status).json({
        success: false,
        error: {
            code: error.code || 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Unexpected server error',
            details: error.details || {},
            requestId: req.requestId,
        },
    });
};

module.exports = {
    sendSuccess,
    sendPaginated,
    sendError,
};