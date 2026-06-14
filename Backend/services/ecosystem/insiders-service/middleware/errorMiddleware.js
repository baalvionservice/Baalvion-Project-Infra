'use strict';

const { AppError } = require('../utils/errors');

/**
 * Handles all application errors
 */
const errorHandler = (err, req, res, next) => {
    console.error('[ERROR]', err);

    const status = err.statusCode || 500;

    res.status(status).json({
        success: false,
        code: err.code || 'INTERNAL_ERROR',
        message: err.message || 'Unexpected error',
    });
};

/**
 * Handles unknown routes (404)
 */
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: `Route not found: ${req.originalUrl}`,
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};