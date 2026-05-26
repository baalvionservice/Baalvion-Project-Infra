'use strict';
const { AppError } = require('../utils/errors');
const { sendError } = require('../utils/response');

const errorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (process.env.NODE_ENV === 'development') console.error('[Commerce Error]', error);
    const normalized = error instanceof AppError ? error : new AppError('INTERNAL_SERVER_ERROR', error.message || 'Unexpected server error', 500);
    return sendError(req, res, normalized);
};

module.exports = { errorHandler };
