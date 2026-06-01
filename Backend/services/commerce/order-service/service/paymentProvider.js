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
    case 'razorpay': return unconfigured('razorpay');
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
