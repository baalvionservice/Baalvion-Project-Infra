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

const Errors = {
    badRequest:   (m = 'Bad request', d) => new AppError('BAD_REQUEST', m, 400, d),
    unauthorized: (m = 'Authentication required') => new AppError('UNAUTHORIZED', m, 401),
    forbidden:    (m = 'Forbidden') => new AppError('FORBIDDEN', m, 403),
    notFound:     (m = 'Not found') => new AppError('NOT_FOUND', m, 404),
    unavailable:  (m = 'Search backend unavailable') => new AppError('SEARCH_UNAVAILABLE', m, 503),
};

module.exports = { AppError, Errors };
