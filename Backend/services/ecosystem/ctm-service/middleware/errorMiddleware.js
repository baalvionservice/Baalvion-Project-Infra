const { AppError } = require('../utils/errors');
const { sendError } = require('../utils/response');
const obs = require('../service/observability');

const notFoundHandler = (req, res, next) =>
    next(new AppError('NOT_FOUND', 'Route not found', 404));

const errorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);
    const n = error instanceof AppError
        ? error
        : new AppError('INTERNAL_SERVER_ERROR', error.message || 'Server error', 500);
    // Capture REAL server errors (5xx) into the observability store — fire-and-forget.
    if ((n.statusCode || 500) >= 500) {
        obs.recordError({
            message: n.message,
            stack: error && error.stack,
            type: n.code || 'INTERNAL_SERVER_ERROR',
            statusCode: n.statusCode || 500,
            userId: req.auth && req.auth.userId,
        });
    }
    return sendError(res, n);
};

module.exports = { notFoundHandler, errorHandler };
