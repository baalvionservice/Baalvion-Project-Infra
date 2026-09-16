'use strict';
const { badRequest } = require('../utils/errors');

/**
 * Zod validation at the transport edge. The parsed result REPLACES req.body/query, so a
 * handler downstream can never reach a field the schema did not declare — Zod strips
 * unknown keys by default, which is what stops a client from setting, say, `moderation_state`
 * by adding it to a create payload (mass assignment).
 */
const validate = (schema, source = 'body') => (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        const details = {};
        for (const issue of result.error.issues) {
            const key = issue.path.join('.') || source;
            (details[key] ||= []).push(issue.message);
        }
        return next(badRequest('The submitted data is not valid', details));
    }
    // req.query is a getter-only accessor in Express 5, so validated input is exposed
    // separately rather than assigned back over it.
    if (source === 'query') req.validatedQuery = result.data;
    else req[source] = result.data;
    return next();
};

module.exports = { validate };
