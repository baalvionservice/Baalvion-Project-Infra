'use strict';
const { AppError } = require('../utils/errors');
const { sendError } = require('../utils/response');

const errorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (process.env.NODE_ENV === 'development') console.error('[Commerce Error]', error);
    // A database uniqueness clash is the caller's conflict, not a server fault, and must not echo
    // column names or values (which could reveal another seller's data).
    if (error && (error.name === 'SequelizeUniqueConstraintError' || (error.original && error.original.code === '23505'))) {
        return sendError(req, res, new AppError('CONFLICT', 'That value is already in use', 409));
    }
    const normalized = error instanceof AppError ? error : new AppError('INTERNAL_SERVER_ERROR', error.message || 'Unexpected server error', 500);
    return sendError(req, res, normalized);
};

module.exports = { errorHandler };
