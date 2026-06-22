'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const pay = require('../service/payments');

// Create an invoice + payment + (provider) checkout in one call. The buyer picks the provider
// (Stripe/Razorpay); the price is SERVER-AUTHORITATIVE (computed from the plan, never trusted
// from the client) and the charge is pinned to the caller's own org.
exports.createCheckout = async (req, res, next) => {
    try {
        const b = req.body;
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');

        // Tenant scoping: the charge is ALWAYS attributed to the caller's own org. Admins may
        // bill another company explicitly; everyone else is pinned to req.auth.orgId — a
        // client-supplied company_id is ignored. (Closes the cross-tenant billing IDOR.)
        const callerOrgId = req.auth?.orgId;
        const companyId = isAdmin ? (b.company_id ?? b.companyId ?? callerOrgId) : callerOrgId;
        if (!companyId) throw new AppError('FORBIDDEN', 'Organization context required', 403);

        // Plan + price are server-authoritative: we NEVER trust a client-sent amount. The charge
        // is computed from the plan row by billing cycle.
        const planId = b.plan_id ?? b.planId;
        if (!planId) throw new AppError('VALIDATION_ERROR', 'plan_id is required', 400);
        const plan = await db.plans.findByPk(planId, { raw: true });
        if (!plan || plan.is_active === false) throw new AppError('NOT_FOUND', 'Plan not found', 404);

        const annual = (b.billing_cycle ?? b.billingCycle) === 'annual';
        const amount = Number(annual ? (plan.annual_price ?? Number(plan.monthly_price) * 10) : plan.monthly_price);
        if (!(amount > 0)) throw new AppError('VALIDATION_ERROR', 'Selected plan is not purchasable', 400);
        const currency = String(plan.currency || b.currency || 'USD').toUpperCase();
        const planName = plan.name;
        const subscriptionId = b.subscription_id ?? b.subscriptionId;

        // Fail closed in production: never create a "successful-looking" checkout with no real
        // gateway behind it. Manual mode is allowed only outside production (dev/demo). The
        // provider config is resolved from the central CMS vault (admin panel), so this reflects
        // whatever keys are pasted in the console.
        const provider = await pay.resolveProvider(b.provider);
        if (provider === 'manual' && process.env.NODE_ENV === 'production') {
            throw new AppError('PAYMENTS_UNAVAILABLE', 'No payment provider is configured', 503);
        }

        const invoice = await db.invoices.create({
            company_id: companyId, subscription_id: subscriptionId, plan_name: planName,
            amount, subtotal: amount, tax: 0, currency,
            status: 'Pending', issued_at: new Date(),
            due_date: new Date(Date.now() + 7 * 86400000),
            line_items: [{ id: 'li-1', description: `${planName} subscription`, quantity: 1, unitPrice: amount, total: amount }],
        });

        const checkout = await pay.createCheckout({
            provider, amount, currency, companyId, planName, invoiceId: invoice.id,
            // Return URLs are server-controlled (never a client-supplied open redirect).
            successUrl: process.env.PAYMENT_SUCCESS_URL || 'https://controlthemarket.com/company/billing?paid=1',
            cancelUrl: process.env.PAYMENT_CANCEL_URL || 'https://controlthemarket.com/company/billing?canceled=1',
            customerEmail: req.auth?.email || b.email || b.customerEmail,
        });

        const payment = await db.payments.create({
            company_id: companyId, subscription_id: subscriptionId, invoice_id: invoice.id,
            provider: checkout.provider, provider_ref: checkout.ref, amount, currency,
            status: checkout.status, checkout_url: checkout.checkoutUrl, raw: checkout.raw || {},
        });

        sendSuccess(res, {
            invoiceId: invoice.id, paymentId: payment.id, provider: checkout.provider,
            checkoutUrl: checkout.checkoutUrl, clientParams: checkout.clientParams,
            status: payment.status, amount, currency,
        }, 201);
    } catch (err) { next(err); }
};

exports.listPayments = async (req, res, next) => {
    try {
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        const where = {};
        if (isAdmin) {
            // Admins may filter by any company or see all.
            if (req.query.company_id) where.company_id = req.query.company_id;
        } else {
            // Non-admins are locked to their own org; query param is ignored.
            const callerOrgId = req.auth?.orgId;
            if (!callerOrgId) throw new AppError('FORBIDDEN', 'Organization context required', 403);
            where.company_id = callerOrgId;
        }
        const rows = await db.payments.findAll({ where, order: [['created_at', 'DESC']], limit: 100 });
        sendSuccess(res, rows);
    } catch (err) { next(err); }
};

// Provider webhook receiver (Stripe / Razorpay / Cashfree). The provider is auto-detected from the
// signature header and verified off the RAW body (captured in index.js). It then marks the payment +
// invoice paid and activates the subscription — idempotently and with amount-integrity checks.
exports.handleWebhook = async (req, res) => {
    try {
        const raw = req.rawBody || (req.body ? Buffer.from(JSON.stringify(req.body)) : Buffer.alloc(0));
        const evt = await pay.verifyWebhook({ rawBody: raw, headers: req.headers });
        if (evt.status === 'succeeded' && evt.ref) {
            const payment = await db.payments.findOne({ where: { provider_ref: evt.ref } });
            if (payment) {
                // Idempotency: an already-succeeded payment short-circuits, so a replayed or
                // redelivered (still signature-valid) event can never double-activate.
                if (payment.status === 'succeeded') {
                    return res.status(200).json({ received: true, idempotent: true });
                }
                // Amount/currency integrity: the event MUST match what we recorded at checkout
                // (server-authoritative). A mismatch is a tamper/misroute signal → do not activate.
                if (evt.amountMinor != null) {
                    const expectedMinor = Math.round(Number(payment.amount) * 100);
                    const currencyOk = !evt.currency || String(evt.currency).toUpperCase() === String(payment.currency).toUpperCase();
                    if (Number(evt.amountMinor) !== expectedMinor || !currencyOk) {
                        await db.integration_logs.create({ source: 'Payments', event_type: evt.type, status: 'Failed', description: `Webhook amount/currency mismatch for ${evt.ref} (got ${evt.amountMinor} ${evt.currency}, expected ${expectedMinor} ${payment.currency})`, related_entity: { type: 'Company', id: payment.company_id } }).catch(() => {});
                        return res.status(400).json({ error: 'amount mismatch' });
                    }
                }
                payment.status = 'succeeded'; payment.raw = evt.raw || payment.raw; await payment.save();
                if (payment.invoice_id) await db.invoices.update({ status: 'Paid' }, { where: { id: payment.invoice_id } });
                if (payment.subscription_id) await db.subscriptions.update({ status: 'active' }, { where: { id: payment.subscription_id } });
                await db.integration_logs.create({ source: 'Payments', event_type: evt.type, status: 'Success', description: `Payment ${evt.ref} succeeded`, related_entity: { type: 'Company', id: payment.company_id } }).catch(() => {});
            }
        }
        res.status(200).json({ received: true });
    } catch (err) {
        // Signature/verification failures surface as 400 so the provider retries appropriately.
        res.status(400).json({ error: String(err.message || err) });
    }
};

// PayU form-POST return (surl/furl). PayU has no signature header and no JSON body — it posts the
// result form-encoded, so it lands here (NOT the JSON webhook). We verify the SHA-512 REVERSE hash
// (the provider's auth, NOT user auth), settle the payment idempotently with an amount-integrity
// check, then 303-redirect the browser back to the billing page. A bad/failed result bounces to the
// cancel URL — never marking a payment paid without a verified success.
exports.payuReturn = async (req, res) => {
    const body = req.body || {};
    const paidUrl = process.env.PAYMENT_SUCCESS_URL || 'https://controlthemarket.com/company/billing?paid=1';
    const cancelUrl = process.env.PAYMENT_CANCEL_URL || 'https://controlthemarket.com/company/billing?canceled=1';
    try {
        if (!(await pay.verifyPayuReturn(body))) return res.redirect(303, cancelUrl);
        const parsed = pay.parsePayuReturn(body);
        if (parsed.status !== 'succeeded' || !parsed.txnid) return res.redirect(303, cancelUrl);

        // Unknown txnid (deleted / wrong instance) → don't show a "paid" page for a payment we can't settle.
        const payment = await db.payments.findOne({ where: { provider_ref: parsed.txnid } });
        if (!payment) return res.redirect(303, cancelUrl);
        if (payment.status !== 'succeeded') {
            // Amount integrity: the settled amount MUST match what we recorded at checkout. Fail closed
            // if PayU's amount is absent/unparseable (don't activate on an unknown amount).
            const expectedMinor = Math.round(Number(payment.amount) * 100);
            const gotMinor = parsed.amountMajor != null && parsed.amountMajor !== '' && Number.isFinite(Number(parsed.amountMajor))
                ? Math.round(Number(parsed.amountMajor) * 100) : null;
            if (gotMinor === null || gotMinor !== expectedMinor) {
                await db.integration_logs.create({ source: 'Payments', event_type: 'payu.return', status: 'Failed', description: `PayU amount mismatch for ${parsed.txnid} (got ${gotMinor}, expected ${expectedMinor})`, related_entity: { type: 'Company', id: payment.company_id } }).catch(() => {});
                return res.redirect(303, cancelUrl);
            }
            payment.status = 'succeeded'; payment.raw = body; await payment.save();
            if (payment.invoice_id) await db.invoices.update({ status: 'Paid' }, { where: { id: payment.invoice_id } });
            if (payment.subscription_id) await db.subscriptions.update({ status: 'active' }, { where: { id: payment.subscription_id } });
            await db.integration_logs.create({ source: 'Payments', event_type: 'payu.return', status: 'Success', description: `PayU payment ${parsed.txnid} succeeded`, related_entity: { type: 'Company', id: payment.company_id } }).catch(() => {});
        }
        return res.redirect(303, paidUrl);
    } catch (err) {
        return res.redirect(303, cancelUrl);
    }
};

exports.providerStatus = async (req, res, next) => {
    try {
        const providers = await pay.configuredProviders();
        sendSuccess(res, { providers, default: providers[0] || null, configured: providers.length > 0 });
    } catch (err) { next(err); }
};

// Admin pre-flight: are the vault keys + webhook secrets all resolvable before taking real money?
exports.health = async (req, res, next) => {
    try { sendSuccess(res, await pay.healthCheck()); } catch (err) { next(err); }
};
