'use strict';
/**
 * Consumer gateway checkout for GTI orders (Razorpay / Stripe / PayU / bank). A direct,
 * shopper-facing settlement rail alongside the escrow/internal saga. Every DB op runs inside a
 * tenant-GUC transaction, so RLS scopes the order + payment to the authenticated buyer's tenant.
 * Capture is provider-authoritative (Razorpay HMAC / Stripe session / PayU reverse-hash) — a client
 * can never self-mark an order paid.
 */
const { z } = require('zod');
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { auditPayment } = require('../utils/audit');
const { getProvider, payuVerifyReturn, payuParseReturn } = require('../integrations/payment/consumerProvider');
const { runWithTenant } = require('@baalvion/tenancy');

const tenantOf = (req) => (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
const STOREFRONT = (process.env.STOREFRONT_URL || 'http://localhost:9003').replace(/\/+$/, '');
const GATEWAYS = ['razorpay', 'stripe', 'payu', 'cashfree', 'bank'];

const intentSchema = z.object({ gateway: z.enum(GATEWAYS) });
const captureSchema = z.object({
    intentId: z.string().min(1).max(200),
    gateway: z.enum(GATEWAYS).optional(),
    verification: z.object({
        razorpay_payment_id: z.string().min(1).max(200),
        razorpay_order_id: z.string().min(1).max(200),
        razorpay_signature: z.string().min(1).max(512),
    }).optional(),
});

// POST /orders/:id/payment-intent — create a gateway payment intent for THIS order.
async function createPaymentIntent(req, res, next) {
    try {
        const body = intentSchema.parse(req.body || {});
        const tenantId = tenantOf(req);
        const result = await db.sequelize.transaction(async (t) => {
            // Tenant-scoped lookup (defence-in-depth atop RLS) — never resolve another tenant's order.
            const order = await db.Order.findOne({ where: { id: req.params.id, tenant_id: tenantId }, transaction: t });
            if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
            if (order.payment_status === 'confirmed') throw new AppError('CONFLICT', 'Order is already paid', 409);
            const provider = getProvider(body.gateway);
            let intent;
            try {
                intent = await provider.createPaymentIntent({
                    orderId: order.id,
                    amount: Number(order.total_value),
                    currencyCode: order.currency,
                    country: order.destination_country,
                });
            } catch (e) {
                // declined / unconfigured gateway / provider down — a payment error, not a server fault.
                throw new AppError('PAYMENT_ERROR', 'Could not initialise payment with the provider', 402);
            }
            // Idempotent insert WITHOUT findOrCreate: the service's patched sequelize.transaction only
            // supports the managed (callback) form, and findOrCreate's internal savepoint uses the
            // unmanaged form — which would crash. A fresh intent_id is unique per call anyway.
            const existing = await db.OrderPayment.findOne({ where: { order_id: order.id, intent_id: intent.intentId }, transaction: t });
            if (!existing) {
                await db.OrderPayment.create({
                    order_id: order.id, tenant_id: tenantId, gateway: body.gateway, provider: provider.name,
                    intent_id: intent.intentId, amount: order.total_value, currency: order.currency,
                    status: 'pending', metadata: { gateway: body.gateway },
                }, { transaction: t });
            }
            return {
                intentId: intent.intentId,
                status: intent.status,
                ...(intent.keyId ? { keyId: intent.keyId, amount: intent.amount, currency: intent.currency } : {}),
                ...(intent.instructions ? { instructions: intent.instructions } : {}),
                ...(intent.redirectUrl ? { redirectUrl: intent.redirectUrl } : {}),
                ...(intent.clientSecret ? { clientSecret: intent.clientSecret } : {}),
                ...(intent.publishableKey ? { publishableKey: intent.publishableKey } : {}),
                ...(intent.formPost ? { formPost: intent.formPost } : {}),
                ...(intent.sessionId ? { sessionId: intent.sessionId, mode: intent.mode, amount: intent.amount, currency: intent.currency } : {}),
            };
        });
        auditPayment(req, 'order.payment_intent', { orderId: req.params.id, gateway: body.gateway, intentId: result.intentId });
        return sendSuccess(req, res, result, 201);
    } catch (err) { return next(err); }
}

// POST /orders/:id/payment-capture — provider-authoritative capture (Razorpay/Stripe; bank stays pending).
async function capturePayment(req, res, next) {
    try {
        const body = captureSchema.parse(req.body || {});
        const tenantId = tenantOf(req);
        const out = await db.sequelize.transaction(async (t) => {
            const order = await db.Order.findOne({ where: { id: req.params.id, tenant_id: tenantId }, transaction: t, lock: t.LOCK.UPDATE });
            if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
            const payment = await db.OrderPayment.findOne({ where: { order_id: order.id, intent_id: body.intentId }, transaction: t });
            if (!payment) throw new AppError('CONFLICT', 'No matching payment intent for this order', 409);
            if (order.payment_status === 'confirmed') return { order, replay: true };
            const gateway = body.gateway || payment.gateway;
            const result = await getProvider(gateway).confirmPayment({ intentId: body.intentId, orderId: order.id, verification: body.verification });
            if (result.status === 'pending') {
                // bank transfer / manual settlement — order stays awaiting funds, NOT failed.
                return { order, pending: true, reason: result.reason };
            }
            if (result.status === 'captured') {
                await payment.update({ status: 'captured', paid_at: new Date(), metadata: { ...(payment.metadata || {}), transactionId: result.transactionId } }, { transaction: t });
                order.payment_status = 'confirmed';
                if (order.status === 'placed' || order.status === 'draft') order.status = 'payment_confirmed';
                await order.save({ transaction: t });
                return { order, captured: true };
            }
            await payment.update({ status: 'failed', metadata: { ...(payment.metadata || {}), reason: result.reason } }, { transaction: t });
            order.payment_status = 'failed';
            await order.save({ transaction: t });
            return { order, failed: true, reason: result.reason };
        });
        if (out.failed) {
            auditPayment(req, 'order.payment_failed', { orderId: req.params.id, intentId: body.intentId, reason: out.reason });
            throw new AppError('PAYMENT_FAILED', `Payment failed: ${out.reason || 'declined'}`, 402);
        }
        auditPayment(req, out.pending ? 'order.payment_pending' : 'order.payment_captured', { orderId: req.params.id, intentId: body.intentId });
        return sendSuccess(req, res, out.order.toJSON());
    } catch (err) { return next(err); }
}

// POST /v1/webhooks/payu — PayU form-POST return. PayU posts the result (form-encoded) here after
// its hosted page. We verify the SHA-512 REVERSE hash (the provider's auth — NOT user auth), settle
// the order CROSS-TENANT under bypass (the same trusted-writer pattern as the razorpay webhook), then
// 303-redirect the browser back to the order. Idempotent + order-row locked.
async function payuReturn(req, res) {
    const body = req.body || {};
    const bounce = (flag, orderId) => res.redirect(303, orderId ? `${STOREFRONT}/orders/${orderId}?payu=${flag}` : `${STOREFRONT}/orders?payu=${flag}`);
    if (!(await payuVerifyReturn(body))) return bounce('failed');
    const parsed = payuParseReturn(body);
    if (!parsed.txnid) return bounce('failed');
    try {
        const out = await runWithTenant({ tenantId: null, bypass: true }, () =>
            db.sequelize.transaction(async (t) => {
                const payment = await db.OrderPayment.findOne({ where: { intent_id: parsed.txnid }, transaction: t });
                if (!payment) return { ok: false };
                const order = await db.Order.findByPk(payment.order_id, { transaction: t, lock: t.LOCK.UPDATE });
                if (!order) return { ok: false };
                if (order.payment_status === 'confirmed') return { ok: true, orderId: order.id, settled: 'paid' };
                // Defence-in-depth atop the reverse-hash: settled amount MUST match the order total.
                if (Math.abs(parseFloat(parsed.amount) - Number(order.total_value)) > 0.01) {
                    return { ok: true, orderId: order.id, settled: 'failed' };
                }
                if (parsed.status === 'captured') {
                    await payment.update({ status: 'captured', paid_at: new Date(), metadata: { ...(payment.metadata || {}), transactionId: parsed.mihpayid, capturedVia: 'payu_return' } }, { transaction: t });
                    order.payment_status = 'confirmed';
                    if (order.status === 'placed' || order.status === 'draft') order.status = 'payment_confirmed';
                    await order.save({ transaction: t });
                    return { ok: true, orderId: order.id, settled: 'paid' };
                }
                await payment.update({ status: 'failed', metadata: { ...(payment.metadata || {}), reason: `payu_${String(body.status || 'failed')}` } }, { transaction: t });
                order.payment_status = 'failed';
                await order.save({ transaction: t });
                return { ok: true, orderId: order.id, settled: 'failed' };
            }));
        if (!out.ok) return bounce('failed');
        return bounce(out.settled === 'paid' ? 'success' : 'failed', out.orderId);
    } catch (e) {
        return bounce('failed');
    }
}

module.exports = { createPaymentIntent, capturePayment, payuReturn };
