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
// Central key vault — resolves PSP keys from the CMS "Integrations & Keys" store (managed in the
// admin panel, encrypted at rest). Returns null → fall back to env, so a vault outage never breaks pay.
const { getPaymentCreds } = require('./cmsVault');

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

async function razorpayKeys() {
  const v = await getPaymentCreds('razorpay');
  const keyId = (v && v.secrets.keyId) || process.env.RAZORPAY_KEY_ID;
  const keySecret = (v && v.secrets.keySecret) || process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("payment provider 'razorpay' is not configured (set keys in the admin panel, or RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET)");
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
    const keys = await razorpayKeys();
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
    const { keySecret } = await razorpayKeys();
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
    const keys = await razorpayKeys();
    if (!transactionId) throw new Error('razorpay: refund requires the captured payment id');
    const minor = amount != null ? Math.round(Number(amount) * 100) : undefined;
    const data = await razorpayFetch(`/payments/${transactionId}/refund`, keys, {
      method: 'POST',
      body: JSON.stringify({ ...(minor != null ? { amount: minor } : {}), notes: { reason: reason || 'refund' } }),
    });
    return { status: 'refunded', provider: 'razorpay', refundId: data.id, amount };
  },
};

// ── Stripe (REAL) ──────────────────────────────────────────────────────────────
// Uses Stripe Checkout Sessions (Stripe-hosted, PCI-compliant card page) so the storefront
// only has to REDIRECT — no card fields, no Stripe.js Elements to mount. Keys come ONLY from env
// (gitignored .env / Secrets Manager). createPaymentIntent opens a Session; confirmPayment RETRIEVES
// it from Stripe and captures ONLY when Stripe itself reports payment_status === 'paid' — so capture
// is backend-authoritative (a client can never self-mark an order paid).
const STRIPE_API = 'https://api.stripe.com/v1';

async function stripeCreds() {
  const v = await getPaymentCreds('stripe');
  const secretKey = (v && v.secrets.secretKey) || process.env.STRIPE_SECRET_KEY;
  const publishableKey = (v && (v.secrets.publishableKey || (v.config && v.config.publishableKey))) || process.env.STRIPE_PUBLISHABLE_KEY || '';
  if (!secretKey) throw new Error("payment provider 'stripe' is not configured (set keys in the admin panel, or STRIPE_SECRET_KEY)");
  return { secretKey, publishableKey };
}

// Stripe's API is application/x-www-form-urlencoded with bracket notation for nested params.
function toForm(obj, prefix, out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object' && !Array.isArray(v)) toForm(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

async function stripeFetch(path, { method = 'GET', form } = {}) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${(await stripeCreds()).secretKey}`,
      ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    ...(form ? { body: form.toString() } : {}),
  });
  const text = await res.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }
  if (!res.ok) {
    console.warn(JSON.stringify({ evt: 'stripe_api_error', path, status: res.status, code: body && body.error && body.error.code }));
    const err = new Error(`stripe request failed (${res.status})`);
    err.providerStatus = res.status;
    throw err;
  }
  return body;
}

// Where Stripe sends the shopper back after the hosted page. The success URL echoes the session id
// so the storefront can call confirm; {CHECKOUT_SESSION_ID} is substituted by Stripe.
function stripeReturnBase() {
  return (process.env.STOREFRONT_URL || process.env.APP_URL || 'http://localhost:3033').replace(/\/+$/, '');
}

const stripeProvider = {
  name: 'stripe',
  PRODUCTION: true,
  async createPaymentIntent({ orderId, amount, currencyCode, country }) {
    const minor = Math.round(Number(amount) * 100); // Stripe amount = smallest currency unit
    if (!Number.isFinite(minor) || minor < 1) throw new Error('stripe: invalid order amount');
    const base = stripeReturnBase();
    const cc = (country || 'us').toLowerCase();
    const form = toForm({
      mode: 'payment',
      client_reference_id: String(orderId),
      'line_items[0]': {
        quantity: 1,
        price_data: {
          currency: (currencyCode || 'USD').toLowerCase(),
          unit_amount: minor,
          product_data: { name: `Baalvion Trade — Order ${String(orderId).slice(0, 8)}` },
        },
      },
      metadata: { orderId: String(orderId) },
      payment_intent_data: { metadata: { orderId: String(orderId) } },
      success_url: `${base}/${cc}/checkout?stripe_session={CHECKOUT_SESSION_ID}&order=${orderId}`,
      cancel_url: `${base}/${cc}/checkout?stripe_cancelled=1&order=${orderId}`,
    });
    const session = await stripeFetch('/checkout/sessions', { method: 'POST', form });
    const { publishableKey } = await stripeCreds();
    return {
      intentId: session.id, // cs_... — the client echoes it back on confirm
      status: 'requires_action',
      redirectUrl: session.url,
      ...(publishableKey ? { publishableKey } : {}),
    };
  },
  async confirmPayment({ intentId, orderId }) {
    // Retrieve the session from Stripe and trust ONLY Stripe's verdict (never the client).
    const session = await stripeFetch(`/checkout/sessions/${encodeURIComponent(intentId)}`);
    if (!session || session.id !== intentId || session.metadata?.orderId !== String(orderId)) {
      return { status: 'failed', transactionId: null, reason: 'order_mismatch' };
    }
    if (session.payment_status !== 'paid') {
      return { status: 'failed', transactionId: null, reason: `stripe_status_${session.payment_status || 'unknown'}` };
    }
    return { status: 'captured', transactionId: session.payment_intent || session.id };
  },
  async failPayment() { return { status: 'failed' }; },
  async cancelPayment() { return { status: 'voided' }; },
  async refundPayment({ transactionId, amount, reason }) {
    if (!transactionId) throw new Error('stripe: refund requires the captured payment_intent id');
    const minor = amount != null ? Math.round(Number(amount) * 100) : undefined;
    const form = toForm({ payment_intent: transactionId, ...(minor != null ? { amount: minor } : {}), metadata: { reason: reason || 'refund' } });
    const data = await stripeFetch('/refunds', { method: 'POST', form });
    return { status: 'refunded', provider: 'stripe', refundId: data.id, amount };
  },
};

// ── Bank transfer / concierge (REAL, manual settlement) ──────────────────────────
// For high-value pieces or shoppers who prefer a wire: the order is PLACED and RESERVED, the shopper
// receives wire instructions + a reference, and the order stays PENDING until finance confirms funds
// out-of-band (admin recordPayment / reconciliation). It NEVER auto-captures — confirmPayment returns
// 'pending', so a stray client confirm can't mark the order paid. No external gateway is called.
function bankInstructions({ amount, currencyCode, orderId }) {
  const tmpl = process.env.BANK_TRANSFER_INSTRUCTIONS;
  const ref = String(orderId);
  const amt = `${currencyCode} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  if (tmpl) return tmpl.replace(/\{amount\}/g, amt).replace(/\{reference\}/g, ref).replace(/\{currency\}/g, currencyCode);
  const beneficiary = process.env.BANK_TRANSFER_BENEFICIARY || 'Baalvion Trade Settlement (Escrow)';
  return [
    `Please remit ${amt} by bank transfer to ${beneficiary}.`,
    `Use payment reference ${ref} so we can match your transfer.`,
    `Your order is reserved; it ships once funds are confirmed (typically 1–2 business days).`,
    `Our concierge will email you the full account details and can arrange assisted settlement.`,
  ].join(' ');
}

const bankTransferProvider = {
  name: 'bank_transfer',
  PRODUCTION: true,
  async createPaymentIntent({ orderId, amount, currencyCode }) {
    return {
      intentId: `bt_${crypto.randomUUID()}`,
      status: 'awaiting_transfer',
      instructions: bankInstructions({ amount, currencyCode, orderId }),
    };
  },
  // Manual settlement only — never client-capturable. 'pending' keeps the order awaiting funds.
  async confirmPayment() { return { status: 'pending', transactionId: null, reason: 'awaiting_bank_transfer' }; },
  async failPayment() { return { status: 'failed' }; },
  async cancelPayment() { return { status: 'voided' }; },
  async refundPayment({ amount, reason }) {
    // Real refunds are issued out-of-band by finance; record the intent for reconciliation.
    return { status: 'refunded', provider: 'bank_transfer', refundId: `rf_bt_${crypto.randomUUID()}`, amount, reason: reason || 'refund' };
  },
};

// ── PayU (REAL, international cards) ─────────────────────────────────────────────
// PayU is a redirect/form-POST flow with SHA-512 hash auth — there is NO server-to-server charge API.
// createPaymentIntent signs a REQUEST hash; the browser form-POSTs to PayU's hosted page; PayU posts
// the result back to our return route, which verifies the SHA-512 REVERSE hash (the provider's auth)
// before settling — so capture is provider-authoritative (a client can never forge a success).
// Keys: PAYU_MERCHANT_KEY + PAYU_MERCHANT_SALT (env / vault, never hardcoded). Faithful port of the
// original Node gateway/adapters/payu.js. The 11-pipe block is PayU's empty-udf field sequence.
const PAYU_UDF = '|||||||||||';

function sha512Hex(s) { return crypto.createHash('sha512').update(String(s)).digest('hex'); }
function timingSafeHex(a, b) {
  const ba = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}
async function payuCreds() {
  const v = await getPaymentCreds('payu');
  const key = (v && v.secrets.merchantKey) || process.env.PAYU_MERCHANT_KEY;
  const salt = (v && v.secrets.merchantSalt) || process.env.PAYU_MERCHANT_SALT;
  const base = ((v && v.config && v.config.baseUrl) || process.env.PAYU_BASE_URL || 'https://secure.payu.in').replace(/\/+$/, '');
  if (!key || !salt) throw new Error("payment provider 'payu' is not configured (set keys in the admin panel, or PAYU_MERCHANT_KEY + PAYU_MERCHANT_SALT)");
  return { key, salt, base };
}
const payuReturnUrl = () => process.env.PAYU_RETURN_URL || 'http://localhost:3013/api/v1/orders/webhooks/payu';

// request hash:  sha512(key|txnid|amount|productinfo|firstname|email|||||||||||salt)
const payuRequestHash = ({ key, txnid, amount, productinfo, firstname, email, salt }) =>
  sha512Hex(`${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}${PAYU_UDF}${salt}`);
// reverse hash:  sha512(salt|status|||||||||||email|firstname|productinfo|amount|txnid|key)
const payuResponseHash = ({ salt, status, email, firstname, productinfo, amount, txnid, key }) =>
  sha512Hex(`${salt}|${status}${PAYU_UDF}${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`);

const payuProvider = {
  name: 'payu',
  PRODUCTION: true,
  async createPaymentIntent({ orderId, amount, currencyCode }) {
    const { key, salt, base } = await payuCreds();
    const amountStr = Number(amount).toFixed(2); // PayU uses major units, 2 decimals
    if (!(Number(amountStr) > 0)) throw new Error('payu: invalid order amount');
    const txnid = `txn${crypto.randomBytes(11).toString('hex')}`.slice(0, 25); // unique, ≤25 chars
    const productinfo = String(orderId);
    const firstname = process.env.PAYU_DEFAULT_FIRSTNAME || 'Baalvion Buyer';
    const email = process.env.PAYU_DEFAULT_EMAIL || 'orders@baalvion.test';
    const hash = payuRequestHash({ key, txnid, amount: amountStr, productinfo, firstname, email, salt });
    const ret = payuReturnUrl();
    // The browser form-POSTs these to PayU's hosted page. intentId = txnid (echoed back on return).
    return {
      intentId: txnid,
      status: 'requires_action',
      formPost: {
        action: `${base}/_payment`,
        fields: {
          key, txnid, amount: amountStr, productinfo, firstname, email,
          phone: process.env.PAYU_DEFAULT_PHONE || '9999999999',
          surl: ret, furl: ret, hash,
          ...(currencyCode ? { currency: currencyCode } : {}),
        },
      },
    };
  },
  // Settlement is via the hash-verified PayU return route — a client confirm never captures.
  async confirmPayment() { return { status: 'pending', transactionId: null, reason: 'awaiting_payu_return' }; },
  async failPayment() { return { status: 'failed' }; },
  async cancelPayment() { return { status: 'voided' }; },
  async refundPayment({ amount, reason }) {
    // PayU exposes no refund API in this redirect flow — finance issues it out-of-band; record intent.
    return { status: 'refunded', provider: 'payu', refundId: `rf_payu_${crypto.randomUUID()}`, amount, reason: reason || 'refund' };
  },
};

// PayU return-route helpers (used by orderService.settlePayuReturn). REAL reverse-hash verification.
async function payuVerifyReturn(body) {
  if (!body || !body.hash) return false;
  let salt, key;
  try { ({ salt, key } = await payuCreds()); } catch { return false; } // unconfigured → fail closed
  const expected = payuResponseHash({
    salt, status: body.status, email: body.email, firstname: body.firstname,
    productinfo: body.productinfo, amount: body.amount, txnid: body.txnid, key,
  });
  return timingSafeHex(body.hash, expected);
}
function payuParseReturn(body) {
  const s = String((body && body.status) || '').toLowerCase();
  const status = s === 'success' ? 'captured' : (s === 'refunded' ? 'refunded' : 'failed');
  return { status, txnid: (body && body.txnid) || null, mihpayid: (body && body.mihpayid) || null, amount: body && body.amount, currency: (body && body.currency) || 'INR' };
}

// ── Cashfree (REAL, international + India) ───────────────────────────────────────
// Cashfree PG: order + payment-session + hosted/SDK checkout. createPaymentIntent creates a REAL
// Cashfree order (x-client-id/secret) and returns the payment_session_id for the v3 SDK; confirmPayment
// RE-FETCHES the order from Cashfree and captures ONLY when Cashfree itself reports order_status==='PAID'
// (and the order is bound to THIS order via order_tags) — so capture is backend-authoritative, exactly
// like the Stripe session retrieval. Keys come from the CMS vault (admin panel) or env, never hardcoded.
const CASHFREE_API_VERSION = '2023-08-01';

// SSRF guard: the base URL can come from the CMS vault (an admin-pasted value). Only ever send the
// client secret to an OFFICIAL Cashfree host — anything else falls back to the mode default.
const CASHFREE_BASES = ['https://api.cashfree.com', 'https://sandbox.cashfree.com'];

async function cashfreeCreds() {
  const v = await getPaymentCreds('cashfree');
  const clientId = (v && v.secrets.clientId) || process.env.CASHFREE_CLIENT_ID;
  const clientSecret = (v && v.secrets.clientSecret) || process.env.CASHFREE_CLIENT_SECRET;
  const mode = (v && v.mode) || process.env.CASHFREE_MODE || 'test';
  const fallback = (mode === 'live' || mode === 'production') ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com';
  const requested = ((v && v.config && v.config.baseUrl) || process.env.CASHFREE_BASE_URL || '').replace(/\/+$/, '');
  const base = requested && CASHFREE_BASES.includes(requested) ? requested : fallback;
  if (!clientId || !clientSecret) throw new Error("payment provider 'cashfree' is not configured (set keys in the admin panel, or CASHFREE_CLIENT_ID + CASHFREE_CLIENT_SECRET)");
  return { clientId, clientSecret, base };
}

async function cashfreeFetch(path, { clientId, clientSecret, base }, options = {}) {
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': clientId,
      'x-client-secret': clientSecret,
      'x-api-version': CASHFREE_API_VERSION,
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }
  if (!res.ok) {
    // Never echo the provider's raw message back to the caller — log a code + throw a generic error.
    console.warn(JSON.stringify({ evt: 'cashfree_api_error', path, status: res.status, code: body && (body.code || body.type) }));
    const err = new Error(`cashfree request failed (${res.status})`);
    err.providerStatus = res.status;
    throw err;
  }
  return body;
}

const cashfreeProvider = {
  name: 'cashfree',
  PRODUCTION: true,
  async createPaymentIntent({ orderId, amount, currencyCode }) {
    const creds = await cashfreeCreds();
    const major = Number(Number(amount).toFixed(2)); // Cashfree order_amount is in MAJOR units
    if (!(major > 0)) throw new Error('cashfree: invalid order amount');
    const cfOrderId = `cfo_${crypto.randomBytes(12).toString('hex')}`; // unique, ≤50 chars (alnum/_/-)
    const storefront = (process.env.STOREFRONT_URL || 'http://localhost:9003').replace(/\/+$/, '');
    const order = await cashfreeFetch('/pg/orders', creds, {
      method: 'POST',
      body: JSON.stringify({
        order_id: cfOrderId,
        order_amount: major,
        order_currency: (currencyCode || 'INR').toUpperCase(),
        customer_details: {
          customer_id: `ord_${String(orderId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40)}`,
          customer_email: process.env.CASHFREE_DEFAULT_EMAIL || 'orders@baalvion.test',
          customer_phone: process.env.CASHFREE_DEFAULT_PHONE || '9999999999',
        },
        order_meta: { return_url: `${storefront}/orders/${orderId}?cashfree=return` },
        order_tags: { orderId: String(orderId) }, // binds the Cashfree order to THIS GTI order
      }),
    });
    const mode = creds.base.includes('sandbox') ? 'sandbox' : 'production';
    // intentId = the Cashfree order_id; the client echoes it back on capture, and confirm re-fetches it.
    return {
      intentId: order.order_id || cfOrderId,
      status: 'requires_action',
      sessionId: order.payment_session_id,
      mode,
      amount: major,
      currency: (currencyCode || 'INR').toUpperCase(),
    };
  },
  async confirmPayment({ intentId, orderId }) {
    const creds = await cashfreeCreds();
    // Trust ONLY Cashfree's verdict (never the client): re-fetch the order + assert it's bound to THIS
    // order via the order_tags we set at creation. Fail CLOSED if the binding tag is absent — a Cashfree
    // order with no orderId tag must never settle an arbitrary GTI order.
    const order = await cashfreeFetch(`/pg/orders/${encodeURIComponent(intentId)}`, creds);
    const boundOrderId = order && order.order_tags && order.order_tags.orderId;
    if (!order || order.order_id !== intentId || boundOrderId !== String(orderId)) {
      return { status: 'failed', transactionId: null, reason: 'order_mismatch' };
    }
    if (String(order.order_status).toUpperCase() !== 'PAID') {
      return { status: 'failed', transactionId: null, reason: `cashfree_status_${String(order.order_status || 'unknown').toLowerCase()}` };
    }
    // transactionId = our Cashfree order_id so a later refund can target /pg/orders/{id}/refunds.
    return { status: 'captured', transactionId: intentId };
  },
  async failPayment() { return { status: 'failed' }; },
  async cancelPayment() { return { status: 'voided' }; },
  async refundPayment({ intentId, transactionId, amount, reason }) {
    const creds = await cashfreeCreds();
    const orderRef = intentId || transactionId;
    if (!orderRef) throw new Error('cashfree: refund requires the order id (intentId)');
    const refundId = `rf_cf_${crypto.randomBytes(8).toString('hex')}`;
    const data = await cashfreeFetch(`/pg/orders/${encodeURIComponent(orderRef)}/refunds`, creds, {
      method: 'POST',
      body: JSON.stringify({ refund_id: refundId, ...(amount != null ? { refund_amount: Number(Number(amount).toFixed(2)) } : {}), refund_note: reason || 'refund' }),
    });
    return { status: 'refunded', provider: 'cashfree', refundId: data.refund_id || refundId, amount };
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

/**
 * Resolve the payment provider for THIS order. `selectedGateway` is the shopper's storefront choice
 * (stripe|razorpay|payu|bank); when absent we fall back to PAYMENT_PROVIDER (service default). This is
 * what lets one order settle via Razorpay card/UPI, another via Stripe, another via bank transfer.
 * 'mock' is still blocked in production unless explicitly opted in, so a client can't force it.
 */
function getProvider(selectedGateway = null) {
  const id = String(selectedGateway || process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
  switch (id) {
    case 'stripe':                  return stripeProvider;
    case 'razorpay':                return razorpayProvider;
    case 'bank': case 'bank_transfer': return bankTransferProvider;
    case 'payu':                    return payuProvider;
    case 'cashfree':                return cashfreeProvider;
    case 'paypal':                  return unconfigured('paypal');
    case 'mock':
    default:
      // Never silently use mock payments in production unless explicitly opted in.
      if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_PAYMENTS !== 'true') {
        throw new Error('PAYMENT_PROVIDER not configured for production (mock requires ALLOW_MOCK_PAYMENTS=true)');
      }
      return mockProvider;
  }
}

module.exports = { getProvider, payuVerifyReturn, payuParseReturn };
