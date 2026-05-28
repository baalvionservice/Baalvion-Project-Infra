const { AppError } = require('../utils/errors');

/**
 * Express middleware that validates req.body using a Zod schema.
 * Attaches parsed (coerced) data to req.validated.
 */
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return next(new AppError(
            'VALIDATION_ERROR',
            'Invalid request body',
            400,
            result.error.flatten()
        ));
    }
    req.validated = result.data;
    return next();
};

const validateQuery = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
        return next(new AppError(
            'VALIDATION_ERROR',
            'Invalid query parameters',
            400,
            result.error.flatten()
        ));
    }
    req.validatedQuery = result.data;
    return next();
};

module.exports = { validate, validateQuery };
