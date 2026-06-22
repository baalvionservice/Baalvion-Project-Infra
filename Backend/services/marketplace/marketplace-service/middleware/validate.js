'use strict';
// Schema-based request validation. One middleware factory replaces the repeated
// `safeParse(...) -> AppError` block that lived in every handler. Validated, coerced data is
// attached to `req.valid.{body,query,params}` so controllers never re-read the raw, untrusted
// `req.body`.
const { AppError } = require('../utils/errors');

const PARTS = ['body', 'query', 'params'];

/**
 * Build an Express middleware that validates the named request parts with Zod schemas.
 * @param {{ body?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny, params?: import('zod').ZodTypeAny }} schemas
 */
const validate = (schemas = {}) => (req, _res, next) => {
    req.valid = req.valid || {};
    for (const part of PARTS) {
        const schema = schemas[part];
        if (!schema) continue;
        const result = schema.safeParse(req[part]);
        if (!result.success) {
            return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, result.error.flatten()));
        }
        req.valid[part] = result.data;
    }
    return next();
};

module.exports = { validate };
