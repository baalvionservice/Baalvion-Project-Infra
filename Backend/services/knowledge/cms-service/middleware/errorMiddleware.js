const { AppError } = require('../utils/errors');
const { sendError } = require('../utils/response');
const { logger } = require('../platform/logger');

const notFoundHandler = (req, res, next) =>
    next(new AppError('NOT_FOUND', `Route not found: ${req.method} ${req.path}`, 404));

const errorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);

    const normalized = error instanceof AppError
        ? error
        : new AppError('INTERNAL_SERVER_ERROR', error.message || 'Unexpected server error', 500);

    // Structured, trace-stamped error logging. Severity reflects the error's TRUE
    // status — a downstream library may throw a 4xx as a plain Error, which must
    // not inflate 5xx log/alert counts. The RESPONSE status is unchanged (a
    // non-AppError still maps to 500 via sendError, exactly as before).
    const trueStatus = error instanceof AppError
        ? error.statusCode
        : Number.isInteger(error.statusCode) ? error.statusCode
            : Number.isInteger(error.status) ? error.status : 500;
    const log = logger('http');
    if (trueStatus >= 500) {
        log.error({ err: error, code: normalized.code, status: trueStatus, method: req.method, path: req.path }, 'request failed');
    } else {
        log.debug({ code: normalized.code, status: trueStatus, method: req.method, path: req.path }, 'request error');
    }

    return sendError(req, res, normalized);
};

module.exports = { notFoundHandler, errorHandler };
