'use strict';
/**
 * Lightweight zod request-body validation middleware.
 *
 * DESIGN CONTRACT (intentionally PERMISSIVE):
 *   These schemas mirror the controllers' existing manual presence checks ONLY —
 *   they must never reject an input the controller currently accepts. For the auth
 *   endpoints that means: validate PRESENCE + TYPE only. Deeper rules that already
 *   live in the controller (e.g. password length ≥ 8, email normalization) are left
 *   exactly where they are, so behavior is unchanged for every previously-valid call.
 *
 * On a schema failure we surface the same AppError('BAD_REQUEST', …, 400) shape the
 * controllers already throw, so the error envelope is identical to the manual path.
 */
const { z } = require('zod');
const { AppError } = require('../utils/errors');

// Body validator factory. Parses req.body against `schema`; on failure forwards a
// 400 AppError (matching the controllers' manual `email and password are required`
// style). On success leaves req.body untouched (no coercion / stripping) so the
// controllers see exactly what they always have.
const validateBody = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body || {});
    if (!result.success) {
        const first = result.error.issues && result.error.issues[0];
        const message = first ? `${first.path.join('.') || 'body'}: ${first.message}` : 'Invalid request body';
        return next(new AppError('BAD_REQUEST', message, 400));
    }
    return next();
};

// ── Auth schemas — PRESENCE + TYPE only (never stricter than the controller) ──

// register: email + password required (strings); username / full_name optional.
// Matches authController.register: `if (!email || !password) … 400`.
const registerSchema = z.object({
    email: z.string({ required_error: 'email and password are required' }).min(1, 'email and password are required'),
    password: z.string({ required_error: 'email and password are required' }).min(1, 'email and password are required'),
    username: z.string().optional(),
    full_name: z.string().optional(),
}).passthrough();

// login: email + password required (strings). Matches authController.login.
const loginSchema = z.object({
    email: z.string({ required_error: 'email and password are required' }).min(1, 'email and password are required'),
    password: z.string({ required_error: 'email and password are required' }).min(1, 'email and password are required'),
}).passthrough();

// reset-password: token + password required (strings). Matches authController.resetPassword.
// (Password length ≥ 8 stays in the controller — not enforced here.)
const resetPasswordSchema = z.object({
    token: z.string({ required_error: 'token and password are required' }).min(1, 'token and password are required'),
    password: z.string({ required_error: 'token and password are required' }).min(1, 'token and password are required'),
}).passthrough();

module.exports = {
    validateBody,
    schemas: { registerSchema, loginSchema, resetPasswordSchema },
};
