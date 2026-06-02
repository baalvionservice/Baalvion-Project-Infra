'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { ensureClient } = require('../utils/provision');
const razorpay = require('../service/razorpay');
const mailer = require('../service/mailer');
const ledger = require('../service/ledger');

// Single "payment settled" side-effect hook (called from create/verify/webhook):
// confirm the booking, credit the lawyer's earnings ledger, email a receipt.
// All side-effects are best-effort and must never fail the payment itself.
const settleBooking = async (payment) => {
    if (payment.status !== 'succeeded') return;
    if (payment.booking_id) {
        await db.Booking.update({ status: 'confirmed' }, { where: { id: payment.booking_id } });
    }
    // Credit lawyer earnings (net of platform fee). Idempotent per payment.
    await ledger.creditFromPayment(payment).catch(() => {});
    // Email receipt to the client.
    try {
        const client = await db.Client.findByPk(payment.client_id, { attributes: ['name', 'email'] });
        if (client && client.email) {
            mailer.sendTemplate('paymentReceipt', client.email, {
                name: client.name, amount: payment.amount, currency: payment.currency,
                reference: payment.provider_tx_id || `PAY-${payment.id}`,
                description: payment.booking_id ? `Booking #${payment.booking_id}` : 'Legal services',
            }).catch(() => {});
        }
    } catch (_) { /* receipt is best-effort */ }
};

const listPayments = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const where = {};
        if (status) where.status = status;

        if (!req.user.isAdmin) {
            const client = await db.Client.findOne({ where: { user_id: String(req.user.id) } });
            const lawyer = await db.Lawyer.findOne({ where: { user_id: String(req.user.id) } });
            const conditions = [];
            if (client) conditions.push({ client_id: client.id });
            if (lawyer) conditions.push({ lawyer_id: lawyer.id });
            if (conditions.length === 0) return sendPaginated(req, res, { items: [], pagination: { total: 0, page: 1, limit: Number(limit), totalPages: 0 } });
            if (conditions.length === 1) Object.assign(where, conditions[0]);
            else where[Op.or] = conditions;
        }

        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Payment.findAndCountAll({
            where,
            include: [
                { model: db.Client, as: 'client', attributes: ['id', 'name', 'email'] },
                { model: db.Lawyer, as: 'lawyer', attributes: ['id', 'name', 'email'], required: false },
            ],
            order: [['created_at', 'DESC']],
            limit: Number(limit),
            offset,
        });
        return sendPaginated(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit: Number(limit), totalPages: Math.ceil(count / Number(limit)) },
        });
    } catch (err) { return next(err); }
};

// Step 1: create the payment + (if Razorpay configured) a Razorpay Order to open Checkout.
const createPayment = async (req, res, next) => {
    try {
        const { booking_id, lawyer_id, amount, currency = 'INR', provider } = req.body;
        const client = await ensureClient(req);
        if (!client) return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));

        let resolvedLawyer = lawyer_id ? Number(lawyer_id) : null;
        if (!resolvedLawyer && booking_id) {
            const bk = await db.Booking.findByPk(Number(booking_id), { attributes: ['lawyer_id'] });
            if (bk) resolvedLawyer = bk.lawyer_id;
        }

        const payment = await db.Payment.create({
            booking_id: booking_id ? Number(booking_id) : null,
            client_id: client.id,
            lawyer_id: resolvedLawyer,
            amount: Number(amount),
            currency,
            status: 'pending',
            provider: provider || 'card',
        });

        if (razorpay.isConfigured()) {
            // Real gateway: open Razorpay Checkout on the client with this order (all payment
            // modes — cards, UPI, netbanking, wallets, bank transfer). Settled on verify/webhook.
            const order = await razorpay.createOrder({
                amount: payment.amount,
                currency: payment.currency,
                receipt: `pay_${payment.id}`,
                notes: { payment_id: String(payment.id), booking_id: String(booking_id || '') },
            });
            await payment.update({ provider: 'razorpay', provider_tx_id: order.id });
            return sendSuccess(req, res, {
                ...payment.toJSON(),
                gateway: 'razorpay',
                razorpay: { orderId: order.id, keyId: razorpay.keyId(), amount: order.amount, currency: order.currency },
            }, 201);
        }

        // No gateway configured -> simulated settlement so the full flow is testable now.
        await payment.update({ status: 'succeeded' });
        await settleBooking(payment);
        return sendSuccess(req, res, { ...payment.toJSON(), gateway: 'simulated' }, 201);
    } catch (err) { return next(err); }
};

// Step 2: verify the Razorpay Checkout callback signature and settle (or simulated settle).
const verifyPayment = async (req, res, next) => {
    try {
        const payment = await db.Payment.findByPk(req.params.id);
        if (!payment) return next(new AppError('NOT_FOUND', 'Payment not found', 404));
        if (!req.user.isAdmin) {
            const client = await db.Client.findOne({ where: { user_id: String(req.user.id) } });
            if (!client || payment.client_id !== client.id) return next(new AppError('FORBIDDEN', 'Not authorised', 403));
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
        // When the gateway is configured, signature verification is mandatory — the branch is
        // chosen by the server-side gateway state, NOT by whether the client supplied a signature.
        // A missing/empty client signature must fail verification, never fall through to settlement.
        if (razorpay.isConfigured()) {
            const ok = razorpay_signature && razorpay.verifyPaymentSignature({
                orderId: razorpay_order_id || payment.provider_tx_id,
                paymentId: razorpay_payment_id,
                signature: razorpay_signature,
            });
            if (!ok) {
                await payment.update({ status: 'failed' });
                return next(new AppError('PAYMENT_VERIFICATION_FAILED', 'Payment signature verification failed', 400));
            }
            await payment.update({ status: 'succeeded', provider_tx_id: razorpay_payment_id || payment.provider_tx_id });
        } else {
            // Simulated path (no keys) — settle.
            await payment.update({ status: 'succeeded' });
        }
        await settleBooking(payment);
        return sendSuccess(req, res, payment);
    } catch (err) { return next(err); }
};

// Razorpay webhook (raw body registered in index.js before the JSON parser).
const webhookHandler = async (req, res) => {
    try {
        const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
        const signature = req.headers['x-razorpay-signature'];
        if (razorpay.isConfigured() && process.env.RAZORPAY_WEBHOOK_SECRET) {
            if (!razorpay.verifyWebhookSignature(raw, signature)) {
                return res.status(400).json({ error: 'invalid signature' });
            }
        }
        const event = JSON.parse(raw.toString('utf8') || '{}');
        const type = event.event;
        const entity = event.payload && (event.payload.payment ? event.payload.payment.entity : (event.payload.order ? event.payload.order.entity : null));

        if (type === 'payment.captured' || type === 'order.paid') {
            const pid = entity && entity.notes && entity.notes.payment_id;
            const orderId = entity && (entity.order_id || entity.id);
            const payment = pid
                ? await db.Payment.findByPk(Number(pid))
                : (orderId ? await db.Payment.findOne({ where: { provider_tx_id: orderId } }) : null);
            if (payment) { await payment.update({ status: 'succeeded' }); await settleBooking(payment); }
        } else if (type === 'payment.failed') {
            const orderId = entity && entity.order_id;
            if (orderId) await db.Payment.update({ status: 'failed' }, { where: { provider_tx_id: orderId } });
        }
        return res.json({ received: true });
    } catch (e) {
        // Never reflect the raw exception message back to the caller (avoids XSS / info leak).
        return res.status(400).json({ error: 'webhook processing failed' });
    }
};

const getPayment = async (req, res, next) => {
    try {
        const payment = await db.Payment.findByPk(req.params.id, {
            include: [
                { model: db.Client, as: 'client', attributes: ['id', 'name', 'email'] },
                { model: db.Lawyer, as: 'lawyer', attributes: ['id', 'name', 'email'], required: false },
            ],
        });
        if (!payment) return next(new AppError('NOT_FOUND', 'Payment not found', 404));
        return sendSuccess(req, res, payment);
    } catch (err) { return next(err); }
};

module.exports = { listPayments, createPayment, verifyPayment, webhookHandler, getPayment };
