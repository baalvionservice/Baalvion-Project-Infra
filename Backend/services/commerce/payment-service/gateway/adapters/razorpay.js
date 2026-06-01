'use strict';
/**
 * Razorpay adapter.
 *
 * - createOrder: live → Razorpay Orders API (Basic auth keyId:keySecret);
 *   mock → deterministic order id (no merchant account needed).
 * - verifyWebhook: REAL HMAC-SHA256(rawBody, webhookSecret) vs x-razorpay-signature.
 * - parseWebhook: maps the Razorpay event envelope to our canonical fields.
 * - signWebhook: produces a valid x-razorpay-signature (used by the E2E / clients).
 */
const { hmacSha256Hex, timingSafeEqual, nowSeconds } = require('./base');

const API = 'https://api.razorpay.com/v1';
const REPLAY_WINDOW_SECONDS = 600; // reject a stale (replayed) signed webhook, atop event-id dedup

function mapStatus(event) {
    switch (event) {
        case 'payment.captured':
        case 'order.paid':
            return 'captured';
        case 'payment.authorized':
            return 'authorized';
        case 'payment.failed':
            return 'failed';
        case 'refund.processed':
        case 'refund.created':
        case 'payment.refunded':
            return 'refunded';
        default:
            return 'failed';
    }
}

async function createOrder({ amount, currency, receipt, notes, secrets, mode }) {
    if (mode !== 'live') {
        const providerOrderId = 'order_mock_' + hmacSha256Hex(`${receipt}:${amount}:${currency}`, secrets.keySecret || 'mock').slice(0, 14);
        return {
            providerOrderId,
            clientParams: { key: secrets.keyId || 'rzp_test_mock', orderId: providerOrderId, amount, currency, name: 'Baalvion' },
            raw: { mocked: true },
        };
    }
    const auth = 'Basic ' + Buffer.from(`${secrets.keyId}:${secrets.keySecret}`).toString('base64');
    const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: auth },
        body: JSON.stringify({ amount, currency, receipt, notes: notes || {} }),
    });
    // Read text first — a proxy/CDN may return non-JSON on 5xx; never let JSON.parse
    // throw before the status check, and never echo the provider's message to the caller.
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = {}; }
    if (!res.ok) { const e = new Error(`razorpay order create failed (HTTP ${res.status})`); e.providerStatus = res.status; throw e; }
    return {
        providerOrderId: data.id,
        clientParams: { key: secrets.keyId, orderId: data.id, amount: data.amount, currency: data.currency, name: 'Baalvion' },
        raw: data,
    };
}

function verifyWebhook({ rawBody, body, headers, secrets }) {
    const sig = headers['x-razorpay-signature'];
    if (!sig || !secrets || !secrets.webhookSecret) return false;
    const raw = typeof rawBody === 'string' ? rawBody : (rawBody ? rawBody.toString('utf8') : '');
    if (!timingSafeEqual(sig, hmacSha256Hex(raw, secrets.webhookSecret))) return false;
    // Replay window (defense-in-depth atop UNIQUE(provider, provider_event_id)): Razorpay signs a
    // top-level `created_at` (Unix seconds). If present, reject a stale/replayed signed event; if
    // absent, fall back to the dedup constraint (never reject a legitimate webhook for lacking it).
    let payload = body;
    if (!payload && raw) { try { payload = JSON.parse(raw); } catch { payload = null; } }
    const createdAt = payload && payload.created_at != null ? Number(payload.created_at) : null;
    if (createdAt != null && Number.isFinite(createdAt) && Math.abs(nowSeconds() - createdAt) > REPLAY_WINDOW_SECONDS) return false;
    return true;
}

function parseWebhook({ body }) {
    const event = body.event || '';
    const payEntity = body.payload && body.payload.payment && body.payload.payment.entity;
    const orderEntity = body.payload && body.payload.order && body.payload.order.entity;
    const entity = payEntity || orderEntity || {};
    const status = mapStatus(event);
    // Dedup key is derived from the SIGNED body (event_type:entity_id), NOT the
    // x-razorpay-event-id header: the header is attacker-settable and changes on
    // each delivery/retry (which would defeat dedup), whereas event_type:entity_id
    // is stable across retries yet distinct across lifecycle events (authorized vs captured).
    const entityId = (payEntity && payEntity.id) || (orderEntity && orderEntity.id) || null;
    return {
        providerEventId: entityId ? `${event}:${entityId}` : null,
        eventType: `payment.${status}`,
        providerOrderId: entity.order_id || (orderEntity && orderEntity.id) || null,
        providerPaymentId: payEntity ? payEntity.id : null,
        amount: entity.amount != null ? Number(entity.amount) : null,
        currency: entity.currency || null,
        status,
        raw: body,
    };
}

/**
 * Issue a refund. mode='live' → Razorpay Refunds API (POST /payments/:id/refund);
 * mock → deterministic refund id (no merchant account). Returns the canonical
 * { providerRefundId, status:'refunded' } the gateway records as a debit ledger entry.
 */
async function refund({ providerPaymentId, amount, secrets, mode }) {
    if (mode !== 'live') {
        const providerRefundId = 'rfnd_mock_' + hmacSha256Hex(`${providerPaymentId}:${amount}`, secrets.keySecret || 'mock').slice(0, 14);
        return { providerRefundId, status: 'refunded', raw: { mocked: true, providerPaymentId, amount } };
    }
    if (!providerPaymentId) { const e = new Error('razorpay refund requires a captured providerPaymentId'); e.code = 'NO_PROVIDER_PAYMENT'; throw e; }
    const auth = 'Basic ' + Buffer.from(`${secrets.keyId}:${secrets.keySecret}`).toString('base64');
    const res = await fetch(`${API}/payments/${providerPaymentId}/refund`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: auth },
        body: JSON.stringify({ amount }),
    });
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = {}; }
    if (!res.ok) { const e = new Error(`razorpay refund failed (HTTP ${res.status})`); e.providerStatus = res.status; throw e; }
    return { providerRefundId: data.id, status: 'refunded', raw: data };
}

/** Test/helper: a valid x-razorpay-signature for a raw body. */
function signWebhook({ rawBody, secrets }) {
    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    return hmacSha256Hex(body, secrets.webhookSecret);
}

module.exports = { name: 'razorpay', createOrder, verifyWebhook, parseWebhook, signWebhook, refund };
