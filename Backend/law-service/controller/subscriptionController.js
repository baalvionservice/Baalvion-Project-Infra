'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const getSubscription = async (req, res, next) => {
    try {
        const client = await db.Client.findOne({ where: { user_id: String(req.user.id) } });
        if (!client) return next(new AppError('NOT_FOUND', 'Client profile not found', 404));
        const subscription = await db.Subscription.findOne({
            where: { client_id: client.id, status: 'active' },
            order: [['started_at', 'DESC']],
        });
        return sendSuccess(req, res, subscription || null);
    } catch (err) { return next(err); }
};

const createSubscription = async (req, res, next) => {
    try {
        const { tier, expires_at } = req.body;
        const validTiers = ['BASIC', 'PROFESSIONAL', 'ENTERPRISE'];
        if (!validTiers.includes(tier)) return next(new AppError('BAD_REQUEST', 'Invalid tier. Must be BASIC, PROFESSIONAL, or ENTERPRISE', 400));

        const client = await db.Client.findOne({ where: { user_id: String(req.user.id) } });
        if (!client) return next(new AppError('NOT_FOUND', 'Client profile not found', 404));

        // Cancel any active subscriptions first
        await db.Subscription.update(
            { status: 'cancelled' },
            { where: { client_id: client.id, status: 'active' } }
        );

        const subscription = await db.Subscription.create({
            client_id: client.id,
            tier,
            status: 'active',
            started_at: new Date(),
            expires_at: expires_at ? new Date(expires_at) : null,
        });

        // Update client's subscription tier
        await client.update({ subscription_tier: tier });

        return sendSuccess(req, res, subscription, 201);
    } catch (err) { return next(err); }
};

const cancelSubscription = async (req, res, next) => {
    try {
        const client = await db.Client.findOne({ where: { user_id: String(req.user.id) } });
        if (!client) return next(new AppError('NOT_FOUND', 'Client profile not found', 404));
        const subscription = await db.Subscription.findOne({
            where: { client_id: client.id, status: 'active' },
        });
        if (!subscription) return next(new AppError('NOT_FOUND', 'No active subscription found', 404));
        await subscription.update({ status: 'cancelled' });
        await client.update({ subscription_tier: 'BASIC' });
        return sendSuccess(req, res, subscription);
    } catch (err) { return next(err); }
};

module.exports = { getSubscription, createSubscription, cancelSubscription };
