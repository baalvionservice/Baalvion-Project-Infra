'use strict';
const { AppError } = require('../utils/errors');
const { sendError } = require('../utils/response');

// Express body-parser failures (malformed JSON, oversized body, bad encoding) carry a `.type`
// and a 4xx `.status`. Map them to the correct client error instead of a misleading 500.
function fromBodyParser(error) {
    if (!error || typeof error.type !== 'string') return null;
    if (error.type === 'entity.parse.failed') return new AppError('BAD_REQUEST', 'Malformed JSON in request body', 400);
    if (error.type === 'entity.too.large') return new AppError('PAYLOAD_TOO_LARGE', 'Request body too large', 413);
    if (error.type === 'encoding.unsupported') return new AppError('UNSUPPORTED_MEDIA_TYPE', 'Unsupported content encoding', 415);
    return null;
}

const errorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (process.env.NODE_ENV === 'development') console.error('[Order Error]', error);
    const normalized = (error instanceof AppError ? error : null)
        || fromBodyParser(error)
        || new AppError('INTERNAL_SERVER_ERROR', error.message || 'Unexpected server error', 500);
    return sendError(req, res, normalized);
};
module.exports = { errorHandler };
