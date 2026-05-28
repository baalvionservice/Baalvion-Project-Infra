'use strict';
const { sendError } = require('../utils/response');
const { AppError } = require('../utils/errors');

const notFoundHandler = (req, res) =>
    sendError(req, res, new AppError('NOT_FOUND', `Route ${req.method} ${req.path} not found`, 404));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    if (!(err instanceof AppError)) {
        // Surface Sequelize validation/constraint errors as 400/409 instead of 500.
        if (err.name === 'SequelizeUniqueConstraintError') {
            err = new AppError('CONFLICT', err.errors?.[0]?.message || 'Resource already exists', 409);
        } else if (err.name === 'SequelizeValidationError') {
            err = new AppError('BAD_REQUEST', err.errors?.[0]?.message || 'Validation failed', 400);
        } else {
            console.error('[insiders-service] unhandled error:', err);
            err = new AppError('INTERNAL_SERVER_ERROR', err.message || 'Something went wrong', 500);
        }
    }
    return sendError(req, res, err);
};

module.exports = { errorHandler, notFoundHandler };
