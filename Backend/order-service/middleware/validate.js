'use strict';
const { AppError } = require('../utils/errors');
const validate = (schema) => (req, res, next) => { const result = schema.safeParse(req.body); if (!result.success) return next(new AppError('VALIDATION_ERROR', 'Invalid request body', 400, result.error.flatten())); req.validated = result.data; return next(); };
const validateQuery = (schema) => (req, res, next) => { const result = schema.safeParse(req.query); if (!result.success) return next(new AppError('VALIDATION_ERROR', 'Invalid query parameters', 400, result.error.flatten())); req.validatedQuery = result.data; return next(); };
module.exports = { validate, validateQuery };
