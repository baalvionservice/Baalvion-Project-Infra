'use strict';
// Permissive zod validation for the two anonymously-creatable (optionalAuth) write surfaces:
// POST /crm/appointments and POST /crm/support-tickets. These are the highest-risk mutation
// routes because they accept unauthenticated input from the public storefront.
//
// DESIGN: validation here is INTENTIONALLY permissive — it mirrors the existing manual checks
// (the model's `allowNull: false` columns) and nothing more. We only assert that the
// already-required fields are present and the right primitive type, and we PASS THROUGH every
// other key untouched (.passthrough()). The controller still strips `id` and defaults `brandId`,
// so this layer must not require them. The goal is to reject obviously-malformed payloads (e.g.
// missing customerName, non-string subject) without rejecting anything the service accepts today.
const { z } = require('zod');
const { AppError } = require('../utils/errors');

// A non-empty string after trimming. Matches a NOT NULL string column that callers must supply.
const requiredString = z
    .string({ required_error: 'is required', invalid_type_error: 'must be a string' })
    .trim()
    .min(1, 'is required');

// POST /crm/appointments — model requires brandId (server-defaulted) + customerName.
// Everything else (customerEmail, type, date, time, city, notes, status, ...) is optional and
// passed through verbatim so storefront payloads keep working unchanged.
const appointmentCreateSchema = z
    .object({
        customerName: requiredString,
    })
    .passthrough();

// POST /crm/support-tickets — model requires brandId (server-defaulted) + customerName + subject.
const supportTicketCreateSchema = z
    .object({
        customerName: requiredString,
        subject: requiredString,
    })
    .passthrough();

/**
 * Express middleware factory: validates req.body against a zod schema, replacing it with the
 * parsed result on success and forwarding a 400 AppError (matching this service's error shape)
 * on failure. Body-only — never touches params/query.
 *
 * @param {import('zod').ZodTypeAny} schema
 * @returns {import('express').RequestHandler}
 */
function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body || {});
        if (!result.success) {
            const details = result.error.issues.map((i) => ({
                field: i.path.join('.') || '(body)',
                message: i.message,
            }));
            const first = details[0];
            const message = first ? `${first.field} ${first.message}` : 'Invalid request body';
            return next(new AppError('VALIDATION_ERROR', message, 400, { issues: details }));
        }
        req.body = result.data;
        return next();
    };
}

module.exports = {
    validateBody,
    appointmentCreateSchema,
    supportTicketCreateSchema,
};
