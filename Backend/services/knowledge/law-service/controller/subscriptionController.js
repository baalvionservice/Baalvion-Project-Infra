'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { planFor, PLANS_LIST } = require('../config/plans');
const { maybeActivateLawyer } = require('../service/lawyerActivation');

// Public — the plan catalog for storefront display (id/name/price/features/recommended).
const getPlans = async (req, res, next) => {
    try {
        return sendSuccess(req, res, PLANS_LIST.map((p) => ({
            id: p.id, name: p.name, price: p.price, currency: p.currency,
            features: p.features, recommended: !!p.recommended,
        })));
    } catch (err) { return next(err); }
};

// Resolve the caller to a client or lawyer profile depending on `subscriberType`
// (defaults to 'client' for full back-compat with the existing client billing flow).
async function resolveSubscriber(req, subscriberType) {
    if (subscriberType === 'lawyer') {
        const lawyer = await db.Lawyer.findOne({ where: { user_id: String(req.user.id) } });
        return { type: 'lawyer', row: lawyer, notFoundMessage: 'Lawyer profile not found' };
    }
    const client = await db.Client.findOne({ where: { user_id: String(req.user.id) } });
    return { type: 'client', row: client, notFoundMessage: 'Client profile not found' };
}

const getSubscription = async (req, res, next) => {
    try {
        const subscriberType = req.query.subscriberType === 'lawyer' ? 'lawyer' : 'client';
        const { row, notFoundMessage } = await resolveSubscriber(req, subscriberType);
        if (!row) return next(new AppError('NOT_FOUND', notFoundMessage, 404));
        const where = subscriberType === 'lawyer'
            ? { lawyer_id: row.id, subscriber_type: 'lawyer', status: 'active' }
            : { client_id: row.id, subscriber_type: 'client', status: 'active' };
        const subscription = await db.Subscription.findOne({ where, order: [['started_at', 'DESC']] });
        return sendSuccess(req, res, subscription || null);
    } catch (err) { return next(err); }
};

const createSubscription = async (req, res, next) => {
    try {
        const { tier, expires_at } = req.body;
        const subscriberType = req.body.subscriberType === 'lawyer' ? 'lawyer' : 'client';
        const validTiers = ['BASIC', 'PROFESSIONAL', 'ENTERPRISE'];
        if (!validTiers.includes(tier)) return next(new AppError('BAD_REQUEST', 'Invalid tier. Must be BASIC, PROFESSIONAL, or ENTERPRISE', 400));

        const { row, notFoundMessage } = await resolveSubscriber(req, subscriberType);
        if (!row) return next(new AppError('NOT_FOUND', notFoundMessage, 404));

        const subscriberWhere = subscriberType === 'lawyer'
            ? { lawyer_id: row.id, subscriber_type: 'lawyer', status: 'active' }
            : { client_id: row.id, subscriber_type: 'client', status: 'active' };
        // Cancel any active subscriptions first
        await db.Subscription.update({ status: 'cancelled' }, { where: subscriberWhere });

        // Stamp price + billing period from the plan catalog so the recurring
        // billing worker can renew (or expire) this subscription automatically.
        const plan = planFor(tier);
        const periodEnd = expires_at
            ? new Date(expires_at)
            : new Date(Date.now() + plan.interval_days * 24 * 60 * 60 * 1000);

        const subscription = await db.Subscription.create({
            client_id: subscriberType === 'client' ? row.id : null,
            lawyer_id: subscriberType === 'lawyer' ? row.id : null,
            subscriber_type: subscriberType,
            tier,
            status: 'active',
            started_at: new Date(),
            expires_at: periodEnd,
            price: plan.price,
            currency: plan.currency,
            interval_days: plan.interval_days,
            last_payment_at: new Date(),
        });

        if (subscriberType === 'client') {
            await row.update({ subscription_tier: tier });
        } else {
            // Subscription step of the registration wizard: activation still
            // requires admin verification (see service/lawyerActivation).
            await maybeActivateLawyer(row.id);
        }

        return sendSuccess(req, res, subscription, 201);
    } catch (err) { return next(err); }
};

const cancelSubscription = async (req, res, next) => {
    try {
        const subscriberType = req.body.subscriberType === 'lawyer' ? 'lawyer' : 'client';
        const { row, notFoundMessage } = await resolveSubscriber(req, subscriberType);
        if (!row) return next(new AppError('NOT_FOUND', notFoundMessage, 404));
        const where = subscriberType === 'lawyer'
            ? { lawyer_id: row.id, subscriber_type: 'lawyer', status: 'active' }
            : { client_id: row.id, subscriber_type: 'client', status: 'active' };
        const subscription = await db.Subscription.findOne({ where });
        if (!subscription) return next(new AppError('NOT_FOUND', 'No active subscription found', 404));
        await subscription.update({ status: 'cancelled' });
        if (subscriberType === 'client') {
            await row.update({ subscription_tier: 'BASIC' });
        } else {
            await maybeActivateLawyer(row.id);
        }
        return sendSuccess(req, res, subscription);
    } catch (err) { return next(err); }
};

module.exports = { getPlans, getSubscription, createSubscription, cancelSubscription };
