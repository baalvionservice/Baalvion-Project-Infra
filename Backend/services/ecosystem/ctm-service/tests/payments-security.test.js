'use strict';
// Locks in the hardened CTM payments behavior (Node's built-in runner, no DB needed):
//   • multi-provider resolution — the buyer picks; sane fallbacks; 'manual' only as last resort
//   • keys resolve from the CMS vault first, then env fallback (here we exercise the env fallback;
//     the vault path is skipped because CMS_BASE_URL is unset)
//   • webhook signature verification is REQUIRED and has NO key-secret fallback
//   • server-authoritative checkout rejects a non-positive amount
//   • controllers derive the billed org / identity from the verified token, never the body
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const pay = require('../service/payments');

function clearPaymentEnv() {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  delete process.env.PAYMENT_PROVIDER;
}

test('configuredProviders reflects which credentials are set (env fallback)', async () => {
  clearPaymentEnv();
  assert.deepEqual(await pay.configuredProviders(), []);
  process.env.RAZORPAY_KEY_ID = 'rzp_test_x';
  process.env.RAZORPAY_KEY_SECRET = 'secret';
  assert.deepEqual(await pay.configuredProviders(), ['razorpay']);
  process.env.STRIPE_SECRET_KEY = 'sk_test_x';
  assert.deepEqual((await pay.configuredProviders()).sort(), ['razorpay', 'stripe']);
  clearPaymentEnv();
});

test('resolveProvider honours a configured request, else default, else first, else manual', async () => {
  clearPaymentEnv();
  assert.equal(await pay.resolveProvider('stripe'), 'manual', 'unconfigured request -> manual');
  process.env.STRIPE_SECRET_KEY = 'sk_test_x';
  process.env.RAZORPAY_KEY_ID = 'rzp_test_x';
  process.env.RAZORPAY_KEY_SECRET = 'secret';
  assert.equal(await pay.resolveProvider('razorpay'), 'razorpay', 'configured request honoured');
  assert.equal(await pay.resolveProvider('stripe'), 'stripe', 'buyer can pick either');
  process.env.PAYMENT_PROVIDER = 'razorpay';
  assert.equal(await pay.resolveProvider(), 'razorpay', 'no request -> default');
  assert.equal(await pay.resolveProvider('bogus'), 'razorpay', 'unconfigured request falls back to default');
  clearPaymentEnv();
});

test('manual checkout fallback works in dev; rejects a non-positive amount', async () => {
  clearPaymentEnv();
  const r = await pay.createCheckout({ amount: 29, currency: 'USD', companyId: 'org-1', planName: 'Pro' });
  assert.equal(r.provider, 'manual');
  assert.equal(r.status, 'pending');
  await assert.rejects(() => pay.createCheckout({ amount: 0 }), /positive/);
  await assert.rejects(() => pay.createCheckout({ amount: -5 }), /positive/);
  clearPaymentEnv();
});

test('verifyWebhook throws when there is no provider signature header', async () => {
  clearPaymentEnv();
  await assert.rejects(() => pay.verifyWebhook({ rawBody: Buffer.from('{}'), headers: {} }), /Unrecognized webhook/);
});

test('Razorpay webhook REQUIRES a dedicated webhook secret (no key-secret fallback)', async () => {
  clearPaymentEnv();
  process.env.RAZORPAY_KEY_SECRET = 'order-key-secret';
  const raw = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { order_id: 'order_1', amount: 2900, currency: 'USD' } } } }));
  const sigFromKeySecret = crypto.createHmac('sha256', 'order-key-secret').update(raw).digest('hex');
  // A signature computed from the KEY secret must NOT verify — the handler needs the webhook secret.
  await assert.rejects(() => pay.verifyWebhook({ rawBody: raw, headers: { 'x-razorpay-signature': sigFromKeySecret } }), /webhook secret not configured/);
  clearPaymentEnv();
});

test('Razorpay webhook accepts a valid HMAC, rejects a forged one, parses amount/currency/notes', async () => {
  clearPaymentEnv();
  process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_live';
  const raw = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { order_id: 'order_9', amount: 7900, currency: 'INR', notes: { companyId: 'org-7' } } } } }));
  const good = crypto.createHmac('sha256', 'whsec_live').update(raw).digest('hex');
  const evt = await pay.verifyWebhook({ rawBody: raw, headers: { 'x-razorpay-signature': good } });
  assert.equal(evt.provider, 'razorpay');
  assert.equal(evt.status, 'succeeded');
  assert.equal(evt.ref, 'order_9');
  assert.equal(evt.amountMinor, 7900);
  assert.equal(evt.currency, 'INR');
  assert.equal(evt.metadata.companyId, 'org-7');
  await assert.rejects(() => pay.verifyWebhook({ rawBody: raw, headers: { 'x-razorpay-signature': 'deadbeef' } }), /Invalid Razorpay signature/);
  clearPaymentEnv();
});

// Source-level regression guards for the controller IDOR/privesc fixes (mirrors the existing
// auth-denial route-wiring test style; cheap and durable against accidental reverts).
test('money/identity writes derive the tenant from the verified token, not the request body', () => {
  const payCtl = fs.readFileSync(path.join(__dirname, '..', 'controller', 'paymentsController.js'), 'utf8');
  assert.ok(payCtl.includes('const companyId = isAdmin ? (b.company_id ?? b.companyId ?? callerOrgId) : callerOrgId;'), 'createCheckout pins company_id to caller org');
  assert.ok(!payCtl.includes('Number(b.amount'), 'createCheckout must not trust a client-sent amount');
  assert.ok(payCtl.includes("if (payment.status === 'succeeded')"), 'webhook idempotent on already-succeeded payments');
  assert.ok(payCtl.includes("error: 'amount mismatch'"), 'webhook validates amount/currency before activating');

  const extras = fs.readFileSync(path.join(__dirname, '..', 'controller', 'extrasController.js'), 'utf8');
  assert.ok(extras.includes('const targetId = isAdmin ? (req.body.id ?? req.body.user_id ?? req.auth?.userId) : req.auth?.userId;'), 'upsertUser pins identity to the verified token');
  assert.ok(extras.includes('const company_id = isAdmin ? (b.company_id ?? b.companyId ?? callerOrgId) : callerOrgId;'), 'createInvoice pins company_id to caller org');
  assert.ok(extras.includes('const company_id = isAdmin ? (b.company_id ?? b.createdBy ?? callerOrgId) : callerOrgId;'), 'createTemplate pins company_id to caller org');
});

// The vault resolver must read the documented field names and degrade safely when the vault is
// unreachable (returns [] → falls back to env), so a key pasted in the admin panel is what's used.
test('payments adapter resolves keys from the CMS vault contract', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'service', 'payments.js'), 'utf8');
  assert.ok(src.includes('/internal/integrations/'), 'calls the CMS internal vault endpoint');
  assert.ok(src.includes("'x-internal-secret'"), 'authenticates to the vault with the internal secret');
  assert.ok(src.includes('control-the-market'), 'defaults to the CTM website slug');
  assert.ok(src.includes('s.keyId') && src.includes('s.keySecret') && src.includes('s.secretKey') && src.includes('webhookSecret'), 'reads the documented vault secret field names');
});
