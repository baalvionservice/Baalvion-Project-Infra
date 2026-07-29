'use strict';
const db = require('../models');
const pay = require('../service/payments');

// Create a subscription + Razorpay checkout. Price is SERVER-AUTHORITATIVE — computed from the
// `plans` row by tier_key + billing_cycle, never trusted from the client.
exports.createCheckout = async (req, res) => {
    try {
        const userId = req.user && req.user.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

        const tierKey = req.body && (req.body.tierKey || req.body.tier_key);
        const billingCycle = req.body && req.body.billingCycle === 'annual' ? 'annual' : 'monthly';
        if (!tierKey) return res.status(400).json({ success: false, error: 'tierKey is required' });

        await pay.seedPlans();
        const plan = await db.Plan.findOne({ where: { tier_key: tierKey, is_active: true } });
        if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });

        const amount = Number(billingCycle === 'annual' ? plan.annual_price : plan.monthly_price);

        // Free tier: no gateway involved, activate immediately.
        if (!(amount > 0)) {
            const subscription = await db.Subscription.create({
                user_id: userId, plan_id: plan.id, billing_cycle: billingCycle, status: 'active',
                current_period_end: new Date(Date.now() + 365 * 86400000),
            });
            return res.json({ success: true, data: { provider: 'free', status: 'active', subscriptionId: subscription.id } });
        }

        if (!(await pay.isConfigured())) {
            return res.status(503).json({ success: false, error: 'Payments are not configured yet' });
        }

        const subscription = await db.Subscription.create({
            user_id: userId, plan_id: plan.id, billing_cycle: billingCycle, status: 'pending',
        });

        const checkout = await pay.createCheckout({
            amount, currency: plan.currency, planName: plan.name,
            notes: { userId: String(userId), subscriptionId: subscription.id },
        });

        const payment = await db.Payment.create({
            user_id: userId, subscription_id: subscription.id, provider: 'razorpay',
            provider_ref: checkout.ref, amount, currency: plan.currency, status: checkout.status, raw: checkout.raw || {},
        });

        return res.json({
            success: true,
            data: { provider: 'razorpay', paymentId: payment.id, subscriptionId: subscription.id, clientParams: checkout.clientParams, amount, currency: plan.currency },
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// Razorpay webhook receiver. Verified off the RAW body (captured in index.js). Marks the payment
// + subscription active idempotently, with an amount-integrity check against what checkout recorded.
exports.handleWebhook = async (req, res) => {
    const raw = req.rawBody || Buffer.alloc(0);
    let evt;
    try {
        evt = await pay.verifyWebhook({ rawBody: raw, headers: req.headers });
    } catch {
        // Bad/unverifiable signature is non-retryable — the ONLY case that legitimately returns 4xx.
        return res.status(400).json({ error: 'invalid signature' });
    }

    try {
        if (evt.status === 'succeeded' && evt.ref) {
            const payment = await db.Payment.findOne({ where: { provider_ref: evt.ref } });
            if (payment) {
                if (evt.amountMinor != null) {
                    const expectedMinor = Math.round(Number(payment.amount) * 100);
                    const currencyOk = !evt.currency || String(evt.currency).toUpperCase() === String(payment.currency).toUpperCase();
                    if (Number(evt.amountMinor) !== expectedMinor || !currencyOk) {
                        return res.status(400).json({ error: 'amount mismatch' });
                    }
                }
                const firstTransition = payment.status !== 'succeeded';
                if (firstTransition) {
                    payment.status = 'succeeded'; payment.raw = evt.raw || payment.raw; await payment.save();
                }
                if (payment.subscription_id) {
                    await db.Subscription.update(
                        { status: 'active', current_period_end: new Date(Date.now() + 31 * 86400000) },
                        { where: { id: payment.subscription_id } },
                    );
                }
                return res.status(200).json({ received: true, idempotent: !firstTransition });
            }
        }
        return res.status(200).json({ received: true });
    } catch (err) {
        // Transient/internal failure → 503 so Razorpay retries (no silent loss of a real payment).
        return res.status(503).json({ error: 'temporary processing error' });
    }
};

exports.providerStatus = async (req, res) => {
    const configured = await pay.isConfigured();
    return res.json({ success: true, data: { providers: configured ? ['razorpay'] : [], preferred: configured ? 'razorpay' : null } });
};

// Public pricing — the same `plans` rows /checkout charges from, so the price a visitor
// sees can never drift from what they're actually charged.
exports.listPlans = async (req, res) => {
    try {
        await pay.seedPlans();
        const plans = await db.Plan.findAll({ where: { is_active: true }, order: [['monthly_price', 'ASC']] });
        return res.json({
            success: true,
            data: plans.map((p) => ({
                tierKey: p.tier_key,
                name: p.name,
                monthlyPrice: Number(p.monthly_price),
                annualPrice: Number(p.annual_price),
                currency: p.currency,
            })),
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// Anonymous (no Bearer token, via optionalAuth) → activeTier: null. Logged in → the
// caller's real active subscription, so the UI never has to guess or hardcode a tier.
exports.myActiveSubscription = async (req, res) => {
    try {
        const userId = req.user && req.user.id;
        if (!userId) return res.json({ success: true, data: { activeTier: null } });

        const subscription = await db.Subscription.findOne({
            where: { user_id: userId, status: 'active' },
            include: [{ model: db.Plan, as: 'plan' }],
            order: [['createdAt', 'DESC']],
        });
        return res.json({
            success: true,
            data: {
                activeTier: subscription && subscription.plan ? subscription.plan.tier_key : null,
                currentPeriodEnd: subscription ? subscription.current_period_end : null,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
