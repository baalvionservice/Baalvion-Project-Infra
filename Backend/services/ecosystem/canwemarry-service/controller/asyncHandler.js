'use strict';

/**
 * Wraps an async handler so a rejected promise reaches the error middleware.
 * Express 5 forwards rejections on its own, but wrapping keeps the behaviour explicit
 * and identical for the handlers that are called directly from tests.
 */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Validated query params, or the raw ones for routes without a query schema. */
const q = (req) => req.validatedQuery || req.query;

module.exports = { asyncHandler, q };
