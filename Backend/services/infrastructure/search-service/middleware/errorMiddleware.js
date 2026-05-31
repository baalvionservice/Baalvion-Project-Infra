'use strict';
const { ZodError } = require('zod');
const { AppError } = require('../utils/errors');
const { sendError } = require('../utils/response');

const notFoundHandler = (req, res, next) => next(new AppError('NOT_FOUND', 'Route not found', 404));

const errorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof ZodError) {
        const issues = error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
        return sendError(req, res, new AppError('VALIDATION_ERROR', 'Request validation failed', 422, { issues }));
    }
    if (error && error.name === 'AuthError') {
        return sendError(req, res, new AppError((error.code || 'UNAUTHORIZED').toUpperCase(), error.message, error.status || 401));
    }
    // OpenSearch connectivity errors → 503 (the backend is down, not a client error).
    if (error && (error.name === 'ConnectionError' || error.code === 'ECONNREFUSED' || /ECONNREFUSED|getaddrinfo|connect ETIMEDOUT/.test(error.message || ''))) {
        return sendError(req, res, new AppError('SEARCH_UNAVAILABLE', 'OpenSearch backend unavailable', 503));
    }
    const normalized = error instanceof AppError ? error : new AppError('INTERNAL_SERVER_ERROR', error.message || 'Unexpected error', 500);
    if (normalized.statusCode >= 500) req.log?.error({ err: error }, 'unhandled error');
    return sendError(req, res, normalized);
};

module.exports = { notFoundHandler, errorHandler };
