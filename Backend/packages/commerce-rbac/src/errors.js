'use strict';
// A minimal error carrying an HTTP statusCode + code, used when the consuming service does not
// inject its own AppError. Services SHOULD inject their AppError so thrown errors are native to
// their error handler; this is the fallback.
class PepError extends Error {
    constructor(code, message, statusCode = 400, details = {}) {
        super(message);
        this.name = 'PepError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }
}

// Normalize an injected AppError class (or fall back to PepError). Returns a factory
// (code, message, statusCode) => Error so call sites stay uniform.
function makeErrorFactory(AppError) {
    if (typeof AppError === 'function') {
        return (code, message, statusCode) => new AppError(code, message, statusCode);
    }
    return (code, message, statusCode) => new PepError(code, message, statusCode);
}

// Duck-typed: any error carrying statusCode 503 means the RBAC service was unreachable.
const isUnreachable = (err) => Boolean(err && Number(err.statusCode) === 503);

module.exports = { PepError, makeErrorFactory, isUnreachable };
