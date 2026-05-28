'use strict';
class AppError extends Error {
    constructor(code, message, statusCode = 400, details = {}) {
        super(message);
        this.name = 'AppError'; this.code = code; this.statusCode = statusCode; this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

// OAuth 2.0 RFC 6749 error format
class OAuthError extends Error {
    constructor(error, description, statusCode = 400) {
        super(description);
        this.name = 'OAuthError'; this.error = error; this.description = description; this.statusCode = statusCode;
    }
}

module.exports = { AppError, OAuthError };
