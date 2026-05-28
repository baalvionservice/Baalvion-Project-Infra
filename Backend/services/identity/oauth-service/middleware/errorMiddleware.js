'use strict';
const { AppError, OAuthError } = require('../utils/errors');
const logger                   = require('../utils/logger');

function errorHandler(err, req, res, _next) {
    // RFC 6749 error format for OAuth endpoints
    if (err instanceof OAuthError) {
        return res.status(err.statusCode).json({
            error:             err.error,
            error_description: err.description,
        });
    }
    if (!(err instanceof AppError)) {
        logger.error({ err, requestId: req.requestId }, 'Unhandled error');
        return res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', requestId: req.requestId },
        });
    }
    if (err.statusCode >= 500) logger.error({ err, requestId: req.requestId }, 'Server error');
    res.status(err.statusCode).json({
        success: false,
        error: { code: err.code, message: err.message, details: err.details, requestId: req.requestId },
    });
}

function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.url} not found` },
    });
}

module.exports = { errorHandler, notFoundHandler };
