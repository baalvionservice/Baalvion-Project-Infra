'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { z } = require('zod');

const subscribeSchema = z.object({
    email: z.string().trim().email().max(320),
    source: z.string().max(100).optional(),
});

const validate = (schema, data) => {
    const result = schema.safeParse(data);
    if (!result.success) {
        const err = new AppError('VALIDATION_ERROR', 'Please provide a valid email address.', 400);
        err.details = result.error.flatten();
        throw err;
    }
    return result.data;
};

// POST /newsletter/subscribe — public. Idempotent: re-subscribing an already-active
// address, or resubscribing one that previously unsubscribed, both succeed rather than
// erroring, since a duplicate submission is not a client mistake worth surfacing.
const subscribe = async (req, res, next) => {
    try {
        const { email, source } = validate(subscribeSchema, req.body || {});
        const normalizedEmail = email.toLowerCase();

        const [subscriber, created] = await db.NewsletterSubscriber.findOrCreate({
            where: { email: normalizedEmail },
            defaults: { email: normalizedEmail, source: source || 'website', status: 'active' },
        });

        if (!created && subscriber.status === 'unsubscribed') {
            await subscriber.update({ status: 'active', subscribed_at: new Date(), unsubscribed_at: null });
        }

        return sendSuccess(req, res, { email: normalizedEmail, status: 'active' });
    } catch (err) { return next(err); }
};

// POST /newsletter/unsubscribe — public (one-click unsubscribe links carry no auth).
const unsubscribe = async (req, res, next) => {
    try {
        const { email } = validate(z.object({ email: z.string().trim().email().max(320) }), req.body || {});
        const normalizedEmail = email.toLowerCase();

        const subscriber = await db.NewsletterSubscriber.findOne({ where: { email: normalizedEmail } });
        if (subscriber && subscriber.status === 'active') {
            await subscriber.update({ status: 'unsubscribed', unsubscribed_at: new Date() });
        }

        // Same response whether or not the address was ever subscribed — never confirm/deny
        // list membership to an unauthenticated caller.
        return sendSuccess(req, res, { email: normalizedEmail, status: 'unsubscribed' });
    } catch (err) { return next(err); }
};

module.exports = { subscribe, unsubscribe };
