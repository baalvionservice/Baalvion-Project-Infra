'use strict';
const { ZodError } = require('zod');
const { AppError } = require('../utils/errors');
const { sendError } = require('../utils/response');

const notFoundHandler = (req, res, next) =>
    next(new AppError('NOT_FOUND', 'Route not found', 404));

const errorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);

    // Zod validation errors → 422 with field details.
    if (error instanceof ZodError) {
        const details = error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
        return sendError(req, res, new AppError('VALIDATION_ERROR', 'Request validation failed', 422, { issues: details }));
    }

    // auth-node throws AuthError with .status/.code on bad tokens.
    if (error && error.name === 'AuthError') {
        return sendError(req, res, new AppError(error.code || 'UNAUTHORIZED', error.message, error.status || 401));
    }

    const normalized = error instanceof AppError
        ? error
        : new AppError('INTERNAL_SERVER_ERROR', error.message || 'Unexpected server error', 500);

    if (normalized.statusCode >= 500) req.log?.error({ err: error }, 'unhandled error');
    return sendError(req, res, normalized);
};

module.exports = { notFoundHandler, errorHandler };
