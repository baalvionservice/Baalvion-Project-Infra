const Stripe = require('stripe');
const config = require('../config/appConfig');
const store = require('./platformStore');
const authService = require('./authService');
const creditService = require('./creditService');
const { AppError } = require('../utils/errors');

const stripe = config.stripe.secretKey ? new Stripe(config.stripe.secretKey) : null;

const getSubscription = async (auth) => {
    const subscriptions = await store.getCollection('subscriptions', auth.orgId);
    return subscriptions[0] || null;
};

const getInvoices = (auth) => store.getCollection('invoices', auth.orgId);

const getPlans = async () => store.getCollection('plans');

const getPlan = async (slug) => {
    const plans = await getPlans();
    return plans.find((plan) => plan.slug === slug) || null;
};

const getPaymentMethods = (auth) => store.getCollection('paymentMethods', auth.orgId);

const getInvoice = async (auth, id) => {
    const invoice = await store.getById('invoices', id, auth.orgId);
    if (!invoice) {
        throw new AppError('INVOICE_NOT_FOUND', 'Invoice not found', 404);
    }
    return invoice;
};

const changePlan = async (auth, planSlug) => {
    const targetPlan = await getPlan(planSlug);
    if (!targetPlan) {
        throw new AppError('PLAN_NOT_FOUND', 'Requested plan does not exist', 404);
    }

    const subscription = await getSubscription(auth);
    if (subscription) {
        await store.update('subscriptions', subscription.id, { planSlug, status: 'active' }, auth.orgId);
    }

    authService.issueEvent('plan.upgraded', auth.orgId, { planSlug });

    if (!stripe) {
        return { checkoutUrl: `https://billing.baalvion.local/checkout/${planSlug}` };
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        success_url: `${config.baseUrl}/billing/success`,
        cancel_url: `${config.baseUrl}/billing/cancel`,
        line_items: [{ price_data: { currency: config.stripe.priceDefaultCurrency, product_data: { name: `${planSlug} plan` }, recurring: { interval: 'month' }, unit_amount: 9900 }, quantity: 1 }],
        metadata: { orgId: auth.orgId, planSlug },
    });

    return { checkoutUrl: session.url };
};

// Activate (or provision) the org's subscription for a plan AFTER a successful
// payment. Unlike changePlan this never creates a new checkout session — it only
// flips the subscription to `active` and renews the period, and keeps the org's
// plan_slug/bandwidth in sync. Idempotent.
const activateSubscription = async (auth, planSlug) => {
    const targetPlan = await getPlan(planSlug);
    if (!targetPlan) {
        throw new AppError('PLAN_NOT_FOUND', 'Requested plan does not exist', 404);
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const fields = {
        planSlug,
        status: 'active',
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
        cancelAtPeriodEnd: false,
    };

    const subscription = await getSubscription(auth);
    if (subscription) {
        await store.update('subscriptions', subscription.id, fields, auth.orgId);
    } else {
        await store.insert('subscriptions', {
            orgId: auth.orgId,
            userId: auth.userId,
            planId: targetPlan.id,
            enforcementMode: 'pay-as-you-go',
            ...fields,
        });
    }

    // Keep the org record's plan/limit in sync (used for feature gating + quotas).
    await store.update('organizations', auth.orgId, {
        planSlug,
        bandwidthLimitGb: targetPlan.bandwidthLimitGb,
    });

    authService.issueEvent('plan.activated', auth.orgId, { planSlug });
    return await getSubscription(auth);
};

// PAYG prepaid top-up: credit the wallet (after a settled payment) and ensure the
// org is on the Pay-As-You-Go plan. Returns the new balance + GB remaining.
const purchaseCredit = async (auth, amountUsd) => {
    const balance = await creditService.addCredit(auth.orgId, amountUsd, 'prepaid-topup');
    const payg = await getPlan('pay-as-you-go');
    if (payg) {
        try { await activateSubscription(auth, 'pay-as-you-go'); } catch (_) { /* non-fatal: balance still added */ }
    }
    return { ...balance, planSlug: 'pay-as-you-go' };
};

const getCreditBalance = async (auth) => creditService.getBalance(auth.orgId);

const addPaymentMethod = async (auth, payload) => store.insert('paymentMethods', { orgId: auth.orgId, ...payload });

const removePaymentMethod = async (auth, id) => {
    const removed = await store.remove('paymentMethods', id, auth.orgId);
    if (!removed) {
        throw new AppError('PAYMENT_METHOD_NOT_FOUND', 'Payment method not found', 404);
    }
};

const getUsageForecast = async (auth) => {
    const organization = await store.getById('organizations', auth.orgId);
    return {
        predicted: (organization?.bandwidthUsedGb || 0) + 420,
        limit: organization?.bandwidthLimitGb || 0,
        trend: 'upward',
    };
};

const handleWebhook = async (payload) => {
    const orgId = payload.data?.object?.metadata?.orgId || 'org_demo';
    const eventType = payload.type || 'invoice.paid';

    if (eventType === 'customer.subscription.deleted') {
        const subscription = await getSubscription({ orgId });
        if (subscription) {
            await store.update('subscriptions', subscription.id, { status: 'cancelled' }, orgId);
        }
        authService.issueEvent('plan.cancelled', orgId, { eventType });
    }

    return { received: true };
};

module.exports = {
    getSubscription,
    getInvoices,
    getPlans,
    getInvoice,
    getPaymentMethods,
    changePlan,
    activateSubscription,
    purchaseCredit,
    getCreditBalance,
    addPaymentMethod,
    removePaymentMethod,
    getUsageForecast,
    handleWebhook,
};