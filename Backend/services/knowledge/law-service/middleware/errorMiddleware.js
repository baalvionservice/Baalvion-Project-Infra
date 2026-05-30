'use strict';
const { AppError } = require('../utils/errors');
const { sendError } = require('../utils/response');

const notFoundHandler = (req, res, next) =>
    next(new AppError('NOT_FOUND', 'Route not found', 404));

const errorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof AppError) return sendError(req, res, error);
    // Unexpected error: log the real cause server-side, but never leak internals
    // (DB messages, column names, stack traces) to clients in production.
    console.error('[law-service] unhandled error:', error && (error.stack || error.message || error));
    const message = process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : (error && error.message) || 'Server error';
    return sendError(req, res, new AppError('INTERNAL_SERVER_ERROR', message, 500));
};

module.exports = { notFoundHandler, errorHandler };
