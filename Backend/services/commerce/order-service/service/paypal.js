'use strict';
// PayPal Orders v2 client: create order -> buyer approves on PayPal -> WE capture server-side.
// Nothing here trusts a browser-supplied status; "paid" is only ever what PayPal's own capture
// response (or a signature-verified webhook) says.
const { Money } = require('@baalvion/money');
const { getPaymentCreds } = require('./cmsVault');

const LIVE_BASE = 'https://api-m.paypal.com';
const SANDBOX_BASE = 'https://api-m.sandbox.paypal.com';

// https://developer.paypal.com/docs/reports/reference/paypal-supported-currencies/
const SUPPORTED_CURRENCIES = new Set([
  'AUD', 'BRL', 'CAD', 'CNY', 'CZK', 'DKK', 'EUR', 'HKD', 'HUF', 'ILS', 'JPY', 'MYR', 'MXN',
  'TWD', 'NZD', 'NOK', 'PHP', 'PLN', 'GBP', 'SGD', 'SEK', 'CHF', 'THB', 'USD',
]);
// PayPal rejects any fractional part for these, even where ISO 4217 has two decimals.
const WHOLE_UNIT_CURRENCIES = new Set(['JPY', 'HUF', 'TWD']);

function safeBase(url) {
  const b = String(url || '').replace(/\/+$/, '');
  return b === LIVE_BASE || b === SANDBOX_BASE ? b : null;
}

async function paypalCreds() {
  const v = await getPaymentCreds('paypal');
  const prefix = process.env.PAYPAL_ENV_PREFIX || '';
  const clientId = (v && v.secrets.clientId) || process.env[`${prefix}PAYPAL_CLIENT_ID`] || process.env.PAYPAL_CLIENT_ID;
  const clientSecret = (v && v.secrets.clientSecret) || process.env[`${prefix}PAYPAL_CLIENT_SECRET`] || process.env.PAYPAL_CLIENT_SECRET;
  const webhookId = (v && v.secrets.webhookId) || process.env.PAYPAL_WEBHOOK_ID || null;
  // An explicit base URL wins. A vault entry without one follows its mode ("live" = production,
  // anything else = sandbox) so a test entry can never reach production or the reverse by omission.
  const vaultDefault = v ? (v.config && v.config.mode === 'live' ? LIVE_BASE : SANDBOX_BASE) : null;
  const baseUrl = safeBase((v && v.config && v.config.baseUrl) || process.env.PAYPAL_BASE_URL) || vaultDefault || LIVE_BASE;
  if (!clientId || !clientSecret) {
    throw new Error("payment provider 'paypal' is not configured (set keys in the admin panel, or PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET)");
  }
  return { clientId, clientSecret, webhookId, baseUrl };
}

const tokenCache = new Map(); // `${base}|${clientId}` -> { token, exp }

async function accessToken(creds) {
  const key = `${creds.baseUrl}|${creds.clientId}`;
  const hit = tokenCache.get(key);
  if (hit && hit.exp - 60_000 > Date.now()) return hit.token;
  const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64');
  const res = await fetch(`${creds.baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: { authorization: `Basic ${basic}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    const err = new Error(`paypal auth failed (${res.status})`);
    err.providerStatus = res.status;
    throw err;
  }
  tokenCache.set(key, { token: body.access_token, exp: Date.now() + (Number(body.expires_in) || 300) * 1000 });
  return body.access_token;
}

async function paypalFetch(path, creds, { method = 'GET', body, requestId } = {}) {
  const res = await fetch(`${creds.baseUrl}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${await accessToken(creds)}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
      ...(requestId ? { 'paypal-request-id': String(requestId).slice(0, 108) } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let parsed = {};
  try { parsed = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }
  if (!res.ok) {
    const issue = parsed && parsed.details && parsed.details[0] && parsed.details[0].issue;
    console.warn(JSON.stringify({ evt: 'paypal_api_error', path, status: res.status, name: parsed && parsed.name, issue }));
    const err = new Error(`paypal request failed (${res.status})`);
    err.providerStatus = res.status;
    err.issue = issue || (parsed && parsed.name) || null;
    throw err;
  }
  return parsed;
}

function assertSupportedCurrency(currencyCode) {
  const c = String(currencyCode || '').toUpperCase();
  if (!SUPPORTED_CURRENCIES.has(c)) throw new Error(`paypal cannot settle currency '${c}'`);
  return c;
}

/** PayPal's decimal string for a Money amount (whole units for JPY/HUF/TWD). */
function toPayPalValue(money) {
  if (!money.isPositive()) throw new Error('paypal: amount must be positive');
  const dec = money.toDecimalString();
  if (!WHOLE_UNIT_CURRENCIES.has(money.currency)) return dec;
  const [whole, frac = ''] = dec.split('.');
  if (/[1-9]/.test(frac)) throw new Error(`paypal: ${money.currency} amounts must be whole units`);
  return whole;
}

function linkHref(obj, rel) {
  const l = (obj.links || []).find((x) => x.rel === rel);
  return l ? l.href : null;
}

async function createOrder({ orderId, amount, currencyCode, returnUrl, cancelUrl, brandName }) {
  const creds = await paypalCreds();
  const currency = assertSupportedCurrency(currencyCode);
  const value = toPayPalValue(Money.fromDatabaseValue(amount, currency));
  const data = await paypalFetch('/v2/checkout/orders', creds, {
    method: 'POST',
    requestId: `ord-${orderId}-${value}-${currency}`,
    body: {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: String(orderId).slice(0, 256),
        custom_id: String(orderId).slice(0, 127),
        amount: { currency_code: currency, value },
      }],
      payment_source: {
        paypal: {
          experience_context: {
            user_action: 'PAY_NOW',
            shipping_preference: 'NO_SHIPPING',
            return_url: returnUrl,
            cancel_url: cancelUrl,
            ...(brandName ? { brand_name: String(brandName).slice(0, 127) } : {}),
          },
        },
      },
    },
  });
  const approvalUrl = linkHref(data, 'payer-action') || linkHref(data, 'approve');
  if (!data.id || !approvalUrl) throw new Error('paypal order create returned no approval link');
  return { paypalOrderId: data.id, approvalUrl, mode: creds.baseUrl === SANDBOX_BASE ? 'sandbox' : 'live', clientId: creds.clientId, value, currency };
}

/** Normalise the first capture of an order/capture response. */
function summariseCapture(order) {
  const pu = (order && order.purchase_units && order.purchase_units[0]) || {};
  const cap = pu.payments && pu.payments.captures && pu.payments.captures[0];
  if (!cap) return { status: 'pending' };
  // The custom_id we stamped on the order when creating it; PayPal returns it untouched.
  const customId = cap.custom_id || pu.custom_id || null;
  if (cap.status === 'COMPLETED') {
    return { status: 'captured', captureId: cap.id, value: cap.amount.value, currency: cap.amount.currency_code, customId };
  }
  if (cap.status === 'DECLINED' || cap.status === 'FAILED') return { status: 'failed', captureId: cap.id, customId };
  return { status: 'pending', captureId: cap.id, customId }; // PENDING / REFUNDED / PARTIALLY_REFUNDED are not new money
}

/**
 * Capture an approved order. Idempotent: if PayPal says it is already captured (reload, webhook
 * raced us) we read the order back instead of erroring.
 */
async function captureOrder(paypalOrderId) {
  const creds = await paypalCreds();
  try {
    const out = await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, creds, {
      method: 'POST', body: {}, requestId: `cap-${paypalOrderId}`,
    });
    return summariseCapture(out);
  } catch (e) {
    if (e.issue === 'ORDER_ALREADY_CAPTURED') return { ...(await getOrderStatus(paypalOrderId)), alreadyCaptured: true };
    if (e.issue === 'ORDER_NOT_APPROVED') return { status: 'not_approved' };
    throw e;
  }
}

async function getOrderStatus(paypalOrderId) {
  const creds = await paypalCreds();
  const order = await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, creds);
  return summariseCapture(order);
}

async function refundCapture({ captureId, amount, currencyCode, reason, requestId }) {
  const creds = await paypalCreds();
  const body = {};
  if (amount != null) {
    const currency = assertSupportedCurrency(currencyCode);
    body.amount = { currency_code: currency, value: toPayPalValue(Money.fromDatabaseValue(amount, currency)) };
  }
  if (reason) body.note_to_payer = String(reason).slice(0, 255);
  const out = await paypalFetch(`/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, creds, {
    method: 'POST', body, requestId: requestId || `rf-${captureId}-${body.amount ? body.amount.value : 'full'}`,
  });
  return { refundId: out.id, status: out.status };
}

/**
 * Verify a webhook with PayPal's own verification endpoint (PayPal signs with a cert chain, not a
 * shared secret). Fails closed on any missing piece or any verdict other than SUCCESS.
 */
async function verifyWebhook({ headers, event }) {
  let creds;
  try { creds = await paypalCreds(); } catch { return false; }
  if (!creds.webhookId) return false;
  const h = (n) => headers[n] || headers[n.toLowerCase()];
  const need = ['paypal-auth-algo', 'paypal-cert-url', 'paypal-transmission-id', 'paypal-transmission-sig', 'paypal-transmission-time'];
  if (need.some((n) => !h(n))) return false;
  try {
    const out = await paypalFetch('/v1/notifications/verify-webhook-signature', creds, {
      method: 'POST',
      body: {
        auth_algo: h('paypal-auth-algo'),
        cert_url: h('paypal-cert-url'),
        transmission_id: h('paypal-transmission-id'),
        transmission_sig: h('paypal-transmission-sig'),
        transmission_time: h('paypal-transmission-time'),
        webhook_id: creds.webhookId,
        webhook_event: event,
      },
    });
    return out.verification_status === 'SUCCESS';
  } catch { return false; }
}

module.exports = {
  paypalCreds, createOrder, captureOrder, getOrderStatus, refundCapture, verifyWebhook,
  assertSupportedCurrency, toPayPalValue, SUPPORTED_CURRENCIES,
};
