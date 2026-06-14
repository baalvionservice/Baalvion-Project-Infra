'use strict';

// Operational error carrying an app-level code, HTTP status, and optional details.
// Thrown by controllers/middleware and rendered by middleware/errorMiddleware.js via
// utils/response.sendError → { success:false, error:{ code, message, details } }.
class AppError extends Error {
    constructor(code, message, statusCode = 500, details = undefined) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        if (details !== undefined) this.details = details;
        this.isOperational = true;
    }
}

module.exports = { AppError };
