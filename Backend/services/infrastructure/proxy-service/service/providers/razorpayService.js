const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

const razorpay = (keyId && keySecret)
    ? new Razorpay({ key_id: keyId, key_secret: keySecret })
    : null;

function assertClient() {
    if (!razorpay) throw new Error('Razorpay credentials are not configured');
}

// ─── Orders ──────────────────────────────────────────────────────────────────
async function createOrder(amount, currency, receipt) {
    assertClient();
    try {
        return await razorpay.orders.create({ amount, currency, receipt, payment_capture: 1 });
    } catch (err) {
        throw new Error(err.error?.description || err.message || 'Razorpay order creation failed');
    }
}

async function fetchOrder(orderId) {
    assertClient();
    try { return await razorpay.orders.fetch(orderId); }
    catch (err) { throw new Error(err.error?.description || err.message); }
}

// ─── Payments ─────────────────────────────────────────────────────────────────
async function fetchPayment(paymentId) {
    assertClient();
    try { return await razorpay.payments.fetch(paymentId); }
    catch (err) { throw new Error(err.error?.description || err.message); }
}

async function capturePayment(paymentId, amount, currency = 'INR') {
    assertClient();
    try { return await razorpay.payments.capture(paymentId, amount, currency); }
    catch (err) { throw new Error(err.error?.description || err.message); }
}

async function listPayments(options = {}) {
    assertClient();
    try { return await razorpay.payments.all(options); }
    catch (err) { throw new Error(err.error?.description || err.message); }
}

// ─── Refunds ──────────────────────────────────────────────────────────────────
async function createRefund(paymentId, amount, notes = {}) {
    assertClient();
    try {
        const body = { speed: 'normal', notes };
        if (amount) body.amount = amount; // partial refund if provided
        return await razorpay.payments.refund(paymentId, body);
    } catch (err) {
        throw new Error(err.error?.description || err.message || 'Razorpay refund failed');
    }
}

async function fetchRefund(paymentId, refundId) {
    assertClient();
    try { return await razorpay.payments.fetchRefund(paymentId, refundId); }
    catch (err) { throw new Error(err.error?.description || err.message); }
}

// ─── Subscriptions ────────────────────────────────────────────────────────────
async function createSubscription({ planId, totalCount = 12, customerId, quantity = 1, addons = [], notes = {} }) {
    assertClient();
    try {
        const body = { plan_id: planId, total_count: totalCount, quantity, addons, notes };
        if (customerId) body.customer_id = customerId;
        return await razorpay.subscriptions.create(body);
    } catch (err) {
        throw new Error(err.error?.description || err.message || 'Razorpay subscription creation failed');
    }
}

async function fetchSubscription(subscriptionId) {
    assertClient();
    try { return await razorpay.subscriptions.fetch(subscriptionId); }
    catch (err) { throw new Error(err.error?.description || err.message); }
}

async function cancelSubscription(subscriptionId, cancelAtCycleEnd = true) {
    assertClient();
    try {
        return await razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
    } catch (err) {
        throw new Error(err.error?.description || err.message || 'Razorpay subscription cancel failed');
    }
}

// ─── Verification ─────────────────────────────────────────────────────────────
function verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!keySecret) throw new Error('Razorpay credentials are not configured');
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
    return expected === razorpay_signature;
}

function verifyWebhookSignature(rawBody, signature) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret || !signature) return false;
    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    return expected === signature;
}

// ─── Webhook event handler ────────────────────────────────────────────────────
async function handleWebhookEvent(event, payload) {
    const models = require('../../models');
    const gateway = 'razorpay';

    switch (event) {
        case 'payment.captured': {
            const p = payload.payment?.entity;
            if (!p) break;
            await models.transactions.update(
                { status: 'captured' },
                { where: { gateway_order_id: p.order_id, gateway } }
            ).catch(() => {});
            break;
        }
        case 'payment.failed': {
            const p = payload.payment?.entity;
            if (!p) break;
            await models.transactions.update(
                { status: 'failed' },
                { where: { gateway_order_id: p.order_id, gateway } }
            ).catch(() => {});
            break;
        }
        case 'order.paid': {
            const o = payload.order?.entity;
            if (!o) break;
            await models.transactions.update(
                { status: 'paid' },
                { where: { gateway_order_id: o.id, gateway } }
            ).catch(() => {});
            break;
        }
        case 'subscription.activated': {
            const s = payload.subscription?.entity;
            if (!s) break;
            await models.subscriptions.update(
                { status: 'active' },
                { where: { gateway_subscription_id: s.id } }
            ).catch(() => {});
            break;
        }
        case 'subscription.charged': {
            const s = payload.subscription?.entity;
            if (!s) break;
            await models.subscriptions.update(
                { status: 'active', current_period_end: new Date(s.current_end * 1000) },
                { where: { gateway_subscription_id: s.id } }
            ).catch(() => {});
            break;
        }
        case 'subscription.cancelled': {
            const s = payload.subscription?.entity;
            if (!s) break;
            await models.subscriptions.update(
                { status: 'cancelled' },
                { where: { gateway_subscription_id: s.id } }
            ).catch(() => {});
            break;
        }
        case 'refund.created': {
            const r = payload.refund?.entity;
            if (r && models.transactions) {
                await models.transactions.create({
                    gateway,
                    gateway_order_id: r.payment_id,
                    amount: -r.amount,
                    currency: r.currency,
                    status: 'refunded',
                }).catch(() => {});
            }
            break;
        }
        default:
            break;
    }
}

// ─── Health Check ──────────────────────────────────────────────────────────────
async function healthCheck() {
    if (!razorpay) return { status: 'inactive', latency: 0, message: 'Razorpay credentials are not configured' };
    const start = Date.now();
    try {
        const response = await razorpay.orders.all({ count: 1, skip: 0 });
        if (response && response.entity === 'collection') return { status: 'active', latency: Date.now() - start, message: 'Razorpay is healthy' };
        return { status: 'degraded', latency: Date.now() - start, message: 'Unexpected response from Razorpay' };
    } catch (err) {
        const latency = Date.now() - start;
        if (err.statusCode === 401) return { status: 'auth_error', latency, message: 'Invalid credentials', error: err.error?.description };
        if (err.statusCode === 429) return { status: 'rate_limited', latency, message: 'Rate limited' };
        return { status: 'inactive', latency, message: 'Razorpay unreachable', error: err.message };
    }
}

module.exports = {
    createOrder, fetchOrder,
    fetchPayment, capturePayment, listPayments,
    createRefund, fetchRefund,
    createSubscription, fetchSubscription, cancelSubscription,
    verifyPayment, verifyWebhookSignature, handleWebhookEvent,
    healthCheck,
};
