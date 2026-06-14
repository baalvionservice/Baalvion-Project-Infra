'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const pay = require('../service/payments');

// Create an invoice + payment + (provider) checkout in one call. Provider-agnostic:
// with no provider configured it still produces a real DB invoice/payment (status pending).
exports.createCheckout = async (req, res, next) => {
    try {
        const b = req.body;
        const companyId = b.company_id ?? b.companyId;
        if (!companyId) throw new AppError('VALIDATION_ERROR', 'company_id is required', 400);

        let amount = Number(b.amount ?? 0);
        let planName = b.plan_name ?? b.planName;
        let subscriptionId = b.subscription_id ?? b.subscriptionId;

        // Derive amount/plan from a plan id if provided.
        if (b.plan_id ?? b.planId) {
            const plan = await db.plans.findByPk(b.plan_id ?? b.planId, { raw: true });
            if (plan) {
                planName = planName || plan.name;
                const annual = (b.billing_cycle ?? b.billingCycle) === 'annual';
                amount = amount || Number(annual ? (plan.annual_price ?? plan.monthly_price * 10) : plan.monthly_price);
            }
        }

        const invoice = await db.invoices.create({
            company_id: companyId, subscription_id: subscriptionId, plan_name: planName,
            amount, subtotal: amount, tax: 0, currency: b.currency || 'USD',
            status: 'Pending', issued_at: new Date(),
            due_date: new Date(Date.now() + 7 * 86400000),
            line_items: [{ id: 'li-1', description: `${planName || 'Plan'} subscription`, quantity: 1, unitPrice: amount, total: amount }],
        });

        const checkout = await pay.createCheckout({
            amount, currency: invoice.currency, companyId, planName, invoiceId: invoice.id,
            successUrl: b.successUrl, cancelUrl: b.cancelUrl, customerEmail: b.customerEmail ?? b.email,
        });

        const payment = await db.payments.create({
            company_id: companyId, subscription_id: subscriptionId, invoice_id: invoice.id,
            provider: checkout.provider, provider_ref: checkout.ref, amount, currency: invoice.currency,
            status: checkout.status, checkout_url: checkout.checkoutUrl, raw: checkout.raw || {},
        });

        sendSuccess(res, {
            invoiceId: invoice.id, paymentId: payment.id, provider: checkout.provider,
            checkoutUrl: checkout.checkoutUrl, status: payment.status, amount, currency: invoice.currency,
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

// Provider webhook receiver (Stripe/Razorpay). Verifies signature off the RAW body
// (captured in index.js), marks the payment + invoice paid, activates the subscription.
exports.handleWebhook = async (req, res, next) => {
    try {
        if (!pay.isConfigured()) return res.status(200).json({ received: true, note: 'no provider configured' });
        const evt = pay.verifyWebhook({ rawBody: req.rawBody || Buffer.from(JSON.stringify(req.body || {})), headers: req.headers });
        if (evt.status === 'succeeded' && evt.ref) {
            const payment = await db.payments.findOne({ where: { provider_ref: evt.ref } });
            if (payment) {
                payment.status = 'succeeded'; payment.raw = evt.raw || payment.raw; await payment.save();
                if (payment.invoice_id) await db.invoices.update({ status: 'Paid' }, { where: { id: payment.invoice_id } });
                if (payment.subscription_id) await db.subscriptions.update({ status: 'active' }, { where: { id: payment.subscription_id } });
                await db.integration_logs.create({ source: 'Payments', event_type: evt.type, status: 'Success', description: `Payment ${evt.ref} succeeded`, related_entity: { type: 'Company', id: payment.company_id } }).catch(() => {});
            }
        }
        res.status(200).json({ received: true });
    } catch (err) {
        // Signature failures must surface as 400 so the provider retries appropriately.
        res.status(400).json({ error: String(err.message || err) });
    }
};

exports.providerStatus = async (req, res) => {
    sendSuccess(res, { provider: pay.activeProvider(), configured: pay.isConfigured() });
};
