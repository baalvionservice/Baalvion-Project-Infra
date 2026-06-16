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

// Create a real invoice row (shows in Billing History + is downloadable). invoices.subscription_id
// is NOT NULL, so a subscription must exist first. Amounts are rounded to 2dp.
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const createInvoiceRecord = async (auth, { subscriptionId, amount, tax = 0, status, dueInDays = 0 }) => {
    const now = new Date();
    const due = new Date(now.getTime() + dueInDays * 24 * 60 * 60 * 1000);
    const amt = round2(amount);
    const t = round2(tax);
    return store.insert('invoices', {
        orgId: auth.orgId,
        userId: auth.userId,
        subscriptionId,
        amount: amt,
        tax: t,
        total: round2(amt + t),
        status,
        issuedAt: now.toISOString(),
        dueAt: due.toISOString(),
    });
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
const activateSubscription = async (auth, planSlug, opts = {}) => {
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

    const activeSub = await getSubscription(auth);

    // Record a PAID invoice for this charge so it appears in Billing History and is
    // downloadable. PAYG is metered (invoiced via the credit wallet), so skip it.
    // opts.amount carries the EXACT charged total (yearly/discount-aware); fall back to
    // the plan's monthly price for a plain monthly activation.
    if (planSlug !== 'pay-as-you-go' && activeSub && !opts.skipInvoice) {
        const charged = opts.amount != null ? Number(opts.amount) : (targetPlan.monthlyPrice || 0);
        if (charged > 0) {
            // Idempotency: the client (/billing/activate) AND the provider webhook can both fire for a
            // single payment. Skip creating a second paid invoice if a matching one (same org + amount)
            // was already recorded in the last 15 minutes, so one payment → one invoice.
            let duplicate = false;
            try {
                const recent = (await getInvoices(auth)) || [];
                const cutoff = Date.now() - 15 * 60 * 1000;
                duplicate = recent.some((inv) =>
                    inv.status === 'paid' &&
                    round2(inv.amount) === round2(charged) &&
                    inv.issuedAt && new Date(inv.issuedAt).getTime() >= cutoff);
            } catch (_) { /* if the lookup fails, fall through and create the invoice */ }
            if (!duplicate) {
                try {
                    await createInvoiceRecord(auth, { subscriptionId: activeSub.id, amount: charged, status: 'paid' });
                } catch (e) { /* non-fatal: the subscription is active even if the invoice row fails */ }
            }
        }
    }

    authService.issueEvent('plan.activated', auth.orgId, { planSlug });
    return activeSub;
};

// Create a PENDING order for offline settlement (bank transfer / wire). Does NOT
// activate the plan — records a pending subscription (only if none exists) + a pending
// invoice. The subscription flips to active when the payment is later confirmed.
const createPendingOrder = async (auth, { planSlug, method, interval = 'monthly', amount } = {}) => {
    if (method !== 'bank' && method !== 'wire') {
        throw new AppError('INVALID_METHOD', 'method must be "bank" or "wire"', 400);
    }
    const targetPlan = await getPlan(planSlug);
    if (!targetPlan) {
        throw new AppError('PLAN_NOT_FOUND', 'Requested plan does not exist', 404);
    }

    // Reuse an existing subscription; only create one if the org has none (never downgrade
    // an active subscriber to pending — the order is just awaiting payment).
    let subscription = await getSubscription(auth);
    if (!subscription) {
        subscription = await store.insert('subscriptions', {
            orgId: auth.orgId,
            userId: auth.userId,
            planId: targetPlan.id,
            planSlug,
            status: 'pending',
            enforcementMode: 'subscription',
            cancelAtPeriodEnd: false,
        });
    }

    const computed = amount != null
        ? Number(amount)
        : (interval === 'yearly' ? (targetPlan.monthlyPrice || 0) * 10 : (targetPlan.monthlyPrice || 0));
    const dueInDays = method === 'wire' ? 30 : 7; // wire ~ Net 30; bank transfer ~ 7 days

    const invoice = await createInvoiceRecord(auth, {
        subscriptionId: subscription.id,
        amount: computed,
        status: 'pending',
        dueInDays,
    });

    authService.issueEvent('order.pending', auth.orgId, { planSlug, method, invoiceId: invoice.id });
    return { invoice, subscription, method, planSlug };
};

// Build a real, server-generated invoice document from the stored invoice + org + plan.
// Returns { filename, contentType, content } — the browser saves `content` verbatim.
const getInvoiceDocument = async (auth, id) => {
    const invoice = await getInvoice(auth, id); // throws 404 if not owned/found
    const org = await store.getById('organizations', auth.orgId);
    const subs = await store.getCollection('subscriptions', auth.orgId);
    const sub = subs.find((s) => String(s.id) === String(invoice.subscriptionId));
    const plan = sub ? await getPlan(sub.planSlug) : null;
    const money = (n) => `$${round2(n).toFixed(2)}`;
    const line = '='.repeat(48);
    const content = [
        'BAALVION NETSTACK — INVOICE',
        line,
        `Invoice #:   INV-${invoice.id}`,
        `Status:      ${String(invoice.status || '').toUpperCase()}`,
        `Issued:      ${(invoice.issuedAt || '').slice(0, 10)}`,
        `Due:         ${(invoice.dueAt || '').slice(0, 10)}`,
        '',
        `Billed to:   ${org?.name || auth.orgId}`,
        `Org ID:      ${auth.orgId}`,
        '',
        'DESCRIPTION                                   AMOUNT',
        '-'.repeat(48),
        `${(plan?.name || sub?.planSlug || 'Subscription').padEnd(40).slice(0, 40)}  ${money(invoice.amount).padStart(8)}`,
        `${'Tax'.padEnd(40)}  ${money(invoice.tax).padStart(8)}`,
        '-'.repeat(48),
        `${'TOTAL'.padEnd(40)}  ${money(invoice.total).padStart(8)}`,
        line,
        'Thank you for your business.',
    ].join('\n');
    return { filename: `invoice-INV-${invoice.id}.txt`, contentType: 'text/plain', content };
};

// PAYG prepaid top-up: credit the wallet (after a settled payment) and ensure the
// org is on the Pay-As-You-Go plan. Returns the new balance + GB remaining.
const purchaseCredit = async (auth, amountUsd, opts = {}) => {
    // opts.ref = the settled gateway payment id. Keying the credit to it makes the top-up idempotent
    // so the client convenience call AND the authoritative provider webhook can't double-credit.
    const balance = await creditService.addCredit(auth.orgId, amountUsd, 'prepaid-topup', { ref: opts.ref });
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
    getPlan,
    getInvoice,
    getPaymentMethods,
    changePlan,
    activateSubscription,
    createPendingOrder,
    getInvoiceDocument,
    purchaseCredit,
    getCreditBalance,
    addPaymentMethod,
    removePaymentMethod,
    getUsageForecast,
    handleWebhook,
};