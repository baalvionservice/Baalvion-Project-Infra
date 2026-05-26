'use strict';

class AppError extends Error {
    constructor(code, message, statusCode = 400, details = {}) {
        super(message);
        this.name       = 'AppError';
        this.code       = code;
        this.statusCode = statusCode;
        this.details    = details;
        this.isOperational = true;
        if (Error.captureStackTrace) Error.captureStackTrace(this, AppError);
    }
}

module.exports = { AppError };
