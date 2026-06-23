'use strict';
/**
 * Zod request-body validation middleware.
 *
 * Additive, fail-soft guardrail: it rejects only inputs the underlying service
 * would already reject (or shapes that are obviously malformed — e.g. a JSON
 * array where an object is expected). Schemas are intentionally PERMISSIVE and
 * use `.passthrough()` so any field the service tolerates today keeps flowing
 * through unchanged. The goal is to stop raw `req.body` being piped into SQL
 * mutations without a shape check — not to tighten existing behaviour.
 *
 * On failure it raises the service's canonical AppError (VALIDATION_ERROR, 400)
 * so the response envelope matches every other validation error in the service.
 */
const { ZodError } = require('zod');
const { AppError } = require('../utils/errors');

function validateBody(schema) {
    return (req, _res, next) => {
        try {
            // Coerce a missing/empty body to {} so optional-only schemas pass,
            // mirroring the controllers' existing `req.body || {}` tolerance.
            const parsed = schema.parse(req.body || {});
            req.body = parsed;
            return next();
        } catch (err) {
            if (err instanceof ZodError) {
                const first = err.issues && err.issues[0];
                const message = first ? `${first.path.join('.') || 'body'}: ${first.message}` : 'Invalid request body';
                return next(new AppError('VALIDATION_ERROR', message, 400, { issues: err.issues }));
            }
            return next(err);
        }
    };
}

module.exports = { validateBody };
