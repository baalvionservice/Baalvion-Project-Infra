'use strict';
const { AppError } = require('../utils/errors');
const { sendError } = require('../utils/response');

const notFoundHandler = (req, res, next) => next(new AppError('NOT_FOUND', 'Route not found', 404));

const errorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);
    // An integration seam (esign/escrow) raises a plain Error carrying `code` + `statusCode`.
    // Flattening those to 500 hid the actual answer — "escrow is not configured" read as a crash.
    // multer raises MulterError with its own code (LIMIT_FILE_SIZE etc.) — answer with 413
    // rather than a 500 that tells the uploader nothing.
    if (error && error.name === 'MulterError') {
        const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        return sendError(req, res, new AppError(error.code, error.message, status));
    }
    const n = error instanceof AppError
        ? error
        : new AppError(
            error.code || 'INTERNAL_SERVER_ERROR',
            error.message || 'Server error',
            Number(error.statusCode) || 500,
        );
    return sendError(req, res, n);
};

module.exports = { notFoundHandler, errorHandler };
