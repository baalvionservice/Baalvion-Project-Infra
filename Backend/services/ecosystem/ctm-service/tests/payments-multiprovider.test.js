'use strict';
// Locks in the CTM PayU + Cashfree additions (Node's built-in runner, no DB / no network needed):
//   • PayU request hash + reverse hash use the documented field sequence and round-trip
//   • PayU createCheckout returns the signed form-POST params (hash matches a recompute)
//   • verifyPayuReturn accepts a valid reverse hash and rejects a tampered field (fail-closed)
//   • Cashfree createCheckout creates an order (mocked fetch) and returns the public session id
//   • Cashfree webhook signature = base64(HMAC-SHA256(timestamp + body, clientSecret)) is REQUIRED
//   • configuredProviders / resolveProvider now span stripe/razorpay/payu/cashfree
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const pay = require('../service/payments');

function clearPaymentEnv() {
  for (const k of [
    'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
    'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET',
    'PAYU_MERCHANT_KEY', 'PAYU_MERCHANT_SALT', 'PAYU_BASE_URL', 'PAYU_RETURN_URL',
    'CASHFREE_CLIENT_ID', 'CASHFREE_CLIENT_SECRET', 'CASHFREE_BASE_URL', 'CASHFREE_NOTIFY_URL',
    'PAYMENT_PROVIDER', 'CMS_BASE_URL',
  ]) delete process.env[k];
}

test('PayU request + reverse hashes use the documented 11-pipe field sequence', () => {
  const { payuRequestHash, payuResponseHash } = pay._internal;
  // request: sha512(key|txnid|amount|productinfo|firstname|email|||||||||||salt)
  const req = payuRequestHash({ key: 'K', txnid: 'T', amount: '29.00', productinfo: 'Pro', firstname: 'Ada', email: 'a@b.com', salt: 'S' });
  assert.equal(req, crypto.createHash('sha512').update('K|T|29.00|Pro|Ada|a@b.com|||||||||||S').digest('hex'));
  // reverse: sha512(salt|status|||||||||||email|firstname|productinfo|amount|txnid|key)
  const rev = payuResponseHash({ salt: 'S', status: 'success', email: 'a@b.com', firstname: 'Ada', productinfo: 'Pro', amount: '29.00', txnid: 'T', key: 'K' });
  assert.equal(rev, crypto.createHash('sha512').update('S|success|||||||||||a@b.com|Ada|Pro|29.00|T|K').digest('hex'));
});

test('configuredProviders / resolveProvider span all four providers (env fallback)', async () => {
  clearPaymentEnv();
  assert.deepEqual(await pay.configuredProviders(), []);
  process.env.PAYU_MERCHANT_KEY = 'k'; process.env.PAYU_MERCHANT_SALT = 's';
  process.env.CASHFREE_CLIENT_ID = 'cid'; process.env.CASHFREE_CLIENT_SECRET = 'csec';
  assert.deepEqual((await pay.configuredProviders()).sort(), ['cashfree', 'payu']);
  assert.equal(await pay.resolveProvider('payu'), 'payu');
  assert.equal(await pay.resolveProvider('cashfree'), 'cashfree');
  clearPaymentEnv();
});

test('PayU createCheckout returns a signed form-POST (hash verifies; only PayU host is targeted)', async () => {
  clearPaymentEnv();
  process.env.PAYU_MERCHANT_KEY = 'merchant_k'; process.env.PAYU_MERCHANT_SALT = 'salt_s';
  const r = await pay.createCheckout({ provider: 'payu', amount: 29, currency: 'USD', planName: 'Pro', invoiceId: 'inv1', customerEmail: 'ada@x.com' });
  assert.equal(r.provider, 'payu');
  assert.match(r.clientParams.action, /^https:\/\/(secure|test)\.payu\.in\/_payment$/);
  const f = r.clientParams.fields;
  assert.equal(f.amount, '29.00');
  assert.ok(f.surl && f.furl && f.phone, 'PayU hosted page requires surl/furl/phone');
  const expected = pay._internal.payuRequestHash({ key: f.key, txnid: f.txnid, amount: f.amount, productinfo: f.productinfo, firstname: f.firstname, email: f.email, salt: 'salt_s' });
  assert.equal(f.hash, expected, 'returned hash matches a recompute over the signed fields');
  clearPaymentEnv();
});

test('verifyPayuReturn accepts a valid reverse hash and rejects a tampered amount', async () => {
  clearPaymentEnv();
  process.env.PAYU_MERCHANT_KEY = 'merchant_k'; process.env.PAYU_MERCHANT_SALT = 'salt_s';
  const body = { status: 'success', email: 'ada@x.com', firstname: 'ada', productinfo: 'Pro', amount: '29.00', txnid: 'txn_1', mihpayid: 'm1' };
  body.hash = pay._internal.payuResponseHash({ salt: 'salt_s', status: body.status, email: body.email, firstname: body.firstname, productinfo: body.productinfo, amount: body.amount, txnid: body.txnid, key: 'merchant_k' });
  assert.equal(await pay.verifyPayuReturn(body), true);
  assert.equal(pay.parsePayuReturn(body).status, 'succeeded');
  // Tamper the amount AFTER signing — the reverse hash must no longer match.
  assert.equal(await pay.verifyPayuReturn({ ...body, amount: '1.00' }), false);
  // Missing hash → fail closed.
  assert.equal(await pay.verifyPayuReturn({ ...body, hash: undefined }), false);
  clearPaymentEnv();
});

test('Cashfree createCheckout creates an order and returns the public payment_session_id', async () => {
  clearPaymentEnv();
  process.env.CASHFREE_CLIENT_ID = 'cid'; process.env.CASHFREE_CLIENT_SECRET = 'csec';
  const realFetch = global.fetch;
  let captured = null;
  global.fetch = async (url, opts) => {
    captured = { url, opts };
    return { ok: true, status: 200, text: async () => JSON.stringify({ order_id: 'cfo_srv', payment_session_id: 'session_abc' }) };
  };
  try {
    const r = await pay.createCheckout({ provider: 'cashfree', amount: 29, currency: 'USD', planName: 'Pro', companyId: 'org1', invoiceId: 'inv1', customerEmail: 'ada@x.com', successUrl: 'https://controlthemarket.com/company/billing?paid=1' });
    assert.equal(r.provider, 'cashfree');
    assert.equal(r.ref, 'cfo_srv');
    assert.equal(r.clientParams.paymentSessionId, 'session_abc');
    assert.match(String(captured.url), /\/pg\/orders$/);
    assert.equal(captured.opts.headers['x-client-id'], 'cid');
    assert.equal(captured.opts.headers['x-client-secret'], 'csec');
    assert.ok(captured.opts.headers['x-api-version'], 'sends the pinned Cashfree API version');
    const sent = JSON.parse(captured.opts.body);
    assert.equal(sent.order_amount, 29, 'Cashfree order_amount is MAJOR units');
    assert.equal(sent.order_meta.notify_url.length > 0, true);
  } finally {
    global.fetch = realFetch;
    clearPaymentEnv();
  }
});

test('Cashfree webhook REQUIRES base64(HMAC-SHA256(timestamp+body, clientSecret))', async () => {
  clearPaymentEnv();
  process.env.CASHFREE_CLIENT_ID = 'cid'; process.env.CASHFREE_CLIENT_SECRET = 'csec';
  const raw = Buffer.from(JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: 'cfo_9', order_amount: 29.0, order_currency: 'USD' }, payment: { cf_payment_id: 'p1' } } }));
  const ts = String(Math.floor(Date.now() / 1000)); // fresh timestamp (staleness window is ±5min)
  const sign = (t) => crypto.createHmac('sha256', 'csec').update(t + raw.toString('utf8')).digest('base64');
  const evt = await pay.verifyWebhook({ rawBody: raw, headers: { 'x-webhook-signature': sign(ts), 'x-webhook-timestamp': ts } });
  assert.equal(evt.provider, 'cashfree');
  assert.equal(evt.status, 'succeeded');
  assert.equal(evt.ref, 'cfo_9');
  assert.equal(evt.amountMinor, 2900, 'MAJOR order_amount converted to MINOR');
  assert.equal(evt.eventId, 'p1');
  // A forged signature must NOT verify.
  await assert.rejects(() => pay.verifyWebhook({ rawBody: raw, headers: { 'x-webhook-signature': 'AAAA', 'x-webhook-timestamp': ts } }), /Invalid Cashfree signature/);
  // A stale timestamp must be rejected even with an otherwise-valid signature (replay bound).
  const staleTs = String(Math.floor(Date.now() / 1000) - 3600);
  await assert.rejects(() => pay.verifyWebhook({ rawBody: raw, headers: { 'x-webhook-signature': sign(staleTs), 'x-webhook-timestamp': staleTs } }), /stale/);
  clearPaymentEnv();
});
