'use strict';
/**
 * Payment provider abstraction (Phase 2). Orders are NEVER auto-paid: the paid transition
 * happens ONLY via backend-authoritative provider confirmation (a client cannot mark itself
 * paid). The default provider is a MOCK explicitly marked NON_PRODUCTION; real adapters
 * (Stripe / Razorpay / PayPal) share this interface and are stubbed-until-configured — they
 * THROW rather than silently "succeeding".
 *
 * Interface:
 *   createPaymentIntent({ orderId, amount, currencyCode }) -> { intentId, status }
 *   confirmPayment({ intentId, orderId })                  -> { status: 'captured'|'failed', transactionId, reason? }
 *   failPayment({ intentId, reason })                      -> { status: 'failed' }
 *   cancelPayment({ intentId })                            -> { status: 'voided' }
 */
const crypto = require('crypto');

// In-memory intent store for the MOCK provider — NON-PRODUCTION (not durable, single-process).
const mockIntents = new Map();

const mockProvider = {
  name: 'mock',
  PRODUCTION: false,
  async createPaymentIntent({ orderId, amount, currencyCode }) {
    const intentId = `pi_mock_${crypto.randomUUID()}`;
    mockIntents.set(intentId, { orderId, amount, currencyCode, status: 'requires_confirmation', transactionId: null });
    return { intentId, status: 'requires_confirmation' };
  },
  async confirmPayment({ intentId, orderId }) {
    // Defense-in-depth: the mock provider performs NO signature verification, so reaching this
    // path in production would let a caller confirm with no real payment. getProvider() already
    // blocks mock in production, but guard the capture path independently so it always fails closed.
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_PAYMENTS !== 'true') {
      return { status: 'failed', transactionId: null, reason: 'mock_disabled_in_production' };
    }
    const intent = mockIntents.get(intentId);
    if (!intent) return { status: 'failed', transactionId: null, reason: 'unknown_intent' };
    if (intent.orderId !== orderId) return { status: 'failed', transactionId: null, reason: 'order_mismatch' };
    if (intent.status === 'captured') return { status: 'captured', transactionId: intent.transactionId }; // idempotent replay
    intent.status = 'captured';
    intent.transactionId = `txn_mock_${crypto.randomUUID()}`;
    return { status: 'captured', transactionId: intent.transactionId };
  },
  async failPayment({ intentId }) {
    const intent = mockIntents.get(intentId);
    if (intent) intent.status = 'failed';
    return { status: 'failed' };
  },
  async cancelPayment({ intentId }) {
    const intent = mockIntents.get(intentId);
    if (intent) intent.status = 'voided';
    return { status: 'voided' };
  },
  async refundPayment({ amount }) {
    // Simulated refund — always succeeds (NON-PRODUCTION). Real adapters call the gateway.
    return { status: 'refunded', refundId: `rf_mock_${crypto.randomUUID()}`, amount };
  },
};

// ── Razorpay (REAL) ───────────────────────────────────────────────────────────
// Keys come ONLY from env (gitignored .env, injected at deploy) — never hardcoded.
// Flow: createPaymentIntent creates a real Razorpay Order; the client opens Razorpay
// Checkout and pays; confirmPayment VERIFIES the handler signature server-side
// (hmac_sha256(order_id|payment_id, keySecret)) so capture is backend-authoritative —
// a client can never self-mark an order paid by forging a confirm call.
const RAZORPAY_API = 'https://api.razorpay.com/v1';

function razorpayKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("payment provider 'razorpay' is not configured (set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET)");
  }
  return { keyId, keySecret };
}

async function razorpayFetch(path, { keyId, keySecret }, options = {}) {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const res = await fetch(`${RAZORPAY_API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}`, ...(options.headers || {}) },
  });
  const text = await res.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }
  if (!res.ok) {
    // Never echo the provider's raw message back to the caller (may leak detail) — log + throw a generic error.
    console.warn(JSON.stringify({ evt: 'razorpay_api_error', path, status: res.status, code: body && body.error && body.error.code }));
    const err = new Error(`razorpay request failed (${res.status})`);
    err.providerStatus = res.status;
    throw err;
  }
  return body;
}

const razorpayProvider = {
  name: 'razorpay',
  PRODUCTION: true,
  async createPaymentIntent({ orderId, amount, currencyCode }) {
    const keys = razorpayKeys();
    // Razorpay amount is in the smallest currency unit (paise/cents). receipt max 40 chars (orderId UUID fits).
    const minor = Math.round(Number(amount) * 100);
    if (!Number.isFinite(minor) || minor < 1) throw new Error('razorpay: invalid order amount');
    const order = await razorpayFetch('/orders', keys, {
      method: 'POST',
      body: JSON.stringify({
        amount: minor,
        currency: (currencyCode || 'INR').toUpperCase(),
        receipt: String(orderId).slice(0, 40),
        notes: { orderId: String(orderId) },
      }),
    });
    // intentId = the Razorpay order_id; the client must echo it back (+ payment_id + signature) on confirm.
    return { intentId: order.id, status: 'requires_action', keyId: keys.keyId, amount: order.amount, currency: order.currency };
  },
  async confirmPayment({ intentId, orderId, verification }) {
    const { keySecret } = razorpayKeys();
    const v = verification || {};
    if (!v.razorpay_payment_id || !v.razorpay_order_id || !v.razorpay_signature) {
      return { status: 'failed', transactionId: null, reason: 'missing_verification' };
    }
    // The signed intent row already binds intentId↔orderId (orderService replay guard); also assert here.
    if (v.razorpay_order_id !== intentId) {
      return { status: 'failed', transactionId: null, reason: 'order_mismatch' };
    }
    // Razorpay Checkout signature = hmac_sha256(order_id + "|" + payment_id, keySecret).
    const expected = crypto.createHmac('sha256', keySecret)
      .update(`${v.razorpay_order_id}|${v.razorpay_payment_id}`)
      .digest('hex');
    // Normalise to lowercase hex (Razorpay always returns lowercase) so a same-length uppercase
    // forgery hits the constant-time compare rather than the length fast-exit — no timing tell.
    const sig = String(v.razorpay_signature).toLowerCase();
    const ok = sig.length === expected.length
      && crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(sig, 'utf8'));
    if (!ok) return { status: 'failed', transactionId: null, reason: 'signature_mismatch' };
    return { status: 'captured', transactionId: v.razorpay_payment_id };
  },
  async failPayment() { return { status: 'failed' }; },
  async cancelPayment() { return { status: 'voided' }; },
  async refundPayment({ transactionId, amount, reason }) {
    const keys = razorpayKeys();
    if (!transactionId) throw new Error('razorpay: refund requires the captured payment id');
    const minor = amount != null ? Math.round(Number(amount) * 100) : undefined;
    const data = await razorpayFetch(`/payments/${transactionId}/refund`, keys, {
      method: 'POST',
      body: JSON.stringify({ ...(minor != null ? { amount: minor } : {}), notes: { reason: reason || 'refund' } }),
    });
    return { status: 'refunded', provider: 'razorpay', refundId: data.id, amount };
  },
};

// Future real adapters — interface-compatible, intentionally unimplemented until configured.
const unconfigured = (name) => ({
  name,
  PRODUCTION: true,
  async createPaymentIntent() { throw new Error(`payment provider '${name}' is not configured`); },
  async confirmPayment() { throw new Error(`payment provider '${name}' is not configured`); },
  async failPayment() { throw new Error(`payment provider '${name}' is not configured`); },
  async cancelPayment() { throw new Error(`payment provider '${name}' is not configured`); },
  async refundPayment() { throw new Error(`payment provider '${name}' is not configured`); },
});

function getProvider() {
  const id = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
  switch (id) {
    case 'stripe':   return unconfigured('stripe');
    case 'razorpay': return razorpayProvider;
    case 'paypal':   return unconfigured('paypal');
    case 'mock':
    default:
      // Never silently use mock payments in production unless explicitly opted in.
      if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_PAYMENTS !== 'true') {
        throw new Error('PAYMENT_PROVIDER not configured for production (mock requires ALLOW_MOCK_PAYMENTS=true)');
      }
      return mockProvider;
  }
}

module.exports = { getProvider };
