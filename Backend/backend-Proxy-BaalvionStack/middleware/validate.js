const { ZodError } = require('zod');
const { AppError } = require('../utils/errors');

const validate = (schema, source = 'body') => (req, res, next) => {
    try {
        req[source] = schema.parse(req[source]);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            return next(new AppError('VALIDATION_ERROR', 'Request validation failed', 400, {
                issues: error.flatten(),
            }));
        }

        return next(error);
    }
};

module.exports = validate;