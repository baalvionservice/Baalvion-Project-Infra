'use strict';

/**
 * The only error type route code should throw. Anything else reaching the error
 * handler is treated as an unexpected fault and its message is withheld from the
 * response — see middleware/errorMiddleware.js.
 */
class AppError extends Error {
    constructor(code, message, statusCode = 400, details = {}) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.expected = true;
    }
}

const badRequest = (message, details) => new AppError('BAD_REQUEST', message, 400, details);
const unauthorized = (message = 'Authentication required') => new AppError('UNAUTHORIZED', message, 401);
const forbidden = (message = 'You do not have permission to do that') => new AppError('FORBIDDEN', message, 403);
const conflict = (message, details) => new AppError('CONFLICT', message, 409, details);
const tooMany = (message = 'Too many requests') => new AppError('RATE_LIMITED', message, 429);

/**
 * Not-found and not-permitted deliberately collapse to the same response.
 * Distinguishing them tells an unauthorized caller that a given private case exists,
 * which is exactly the fact the visibility rules are protecting.
 */
const notFound = (what = 'Resource') => new AppError('NOT_FOUND', `${what} not found`, 404);

module.exports = { AppError, badRequest, unauthorized, forbidden, notFound, conflict, tooMany };
