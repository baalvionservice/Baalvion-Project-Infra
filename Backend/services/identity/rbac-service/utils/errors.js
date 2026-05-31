'use strict';

class AppError extends Error {
    constructor(code, message, statusCode = 400, details = {}) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }
}

// Convenience factories — keep error shapes consistent across the service.
const Errors = {
    badRequest:   (msg = 'Bad request', details)   => new AppError('BAD_REQUEST', msg, 400, details),
    unauthorized: (msg = 'Authentication required') => new AppError('UNAUTHORIZED', msg, 401),
    forbidden:    (msg = 'Forbidden')               => new AppError('FORBIDDEN', msg, 403),
    notFound:     (msg = 'Resource not found')      => new AppError('NOT_FOUND', msg, 404),
    conflict:     (msg = 'Resource already exists') => new AppError('CONFLICT', msg, 409),
    validation:   (msg, details)                    => new AppError('VALIDATION_ERROR', msg || 'Validation failed', 422, details),
};

module.exports = { AppError, Errors };
