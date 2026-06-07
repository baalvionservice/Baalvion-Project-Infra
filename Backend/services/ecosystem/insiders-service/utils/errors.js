'use strict';

class AppError extends Error {
    constructor(code, message, statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
    }
}

// 404 handler
const notFoundHandler = (req, res, next) => {
    const err = new AppError(
        'NOT_FOUND',
        `Route not found: ${req.originalUrl}`,
        404
    );
    next(err);
};

// global error handler
const errorHandler = (err, req, res, next) => {
    const status = err.statusCode || 500;

    return res.status(status).json({
        success: false,
        code: err.code || 'INTERNAL_ERROR',
        message: err.message || 'Something went wrong',
    });
};

module.exports = {
    AppError,
    errorHandler,
    notFoundHandler
};