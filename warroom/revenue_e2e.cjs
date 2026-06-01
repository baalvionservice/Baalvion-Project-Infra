'use strict';
/**
 * War-room revenue-path E2E harness (dependency-free).
 * Mints a valid RS256 platform JWT (hand-rolled, signs with the platform private key)
 * and drives the order-service checkout flow against the LIVE service on :3013.
 *
 * Flow: createOrder -> payment intent -> confirm -> verify PAID  [-> refund if --refund]
 * Evidence: prints HTTP status + body for every step. No fabrication.
 */
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = 'd:/Baalvion Projects';
const PRIV = fs.readFileSync(path.join(ROOT, 'docker/secrets/jwt_private_key.pem'), 'utf8');

const HOST = '127.0.0.1';
const PORT = 3013;
const STORE = 'a0a00000-0000-4000-8000-000000000001';
const PRODUCT = 'ec572c4a-4745-4679-8edd-493ee557a2c5';
const CUSTOMER = 'c0000000-0000-4000-8000-000000000001';
const CUSTOMER_USER_ID = '9000001';

// ── key pairing sanity check (private key must pair with order-service's configured public key) ──
function envVal(file, key) {
  const line = fs.readFileSync(file, 'utf8').split(/\r?\n/).find((l) => l.startsWith(key + '='));
  return line ? line.slice(key.length + 1).trim() : null;
}
function modOf(pem) { try { return crypto.createPublicKey(pem).export({ format: 'jwk' }).n; } catch { return null; } }
const osPub = (envVal(path.join(ROOT, 'Backend/services/commerce/order-service/.env'), 'JWT_PUBLIC_KEY') || '').replace(/\\n/g, '\n');
const derivedPub = crypto.createPublicKey(PRIV).export({ type: 'spki', format: 'pem' });
console.log('[keycheck] order-service public key pairs with private key:', !!osPub && modOf(osPub) === modOf(derivedPub));

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function mintToken({ sub, roles }) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT', kid: 'baalvion-key-1' };
  const payload = {
    sub: String(sub), email: `user${sub}@baalvion.test`,
    org_id: STORE, sid: 'sess-' + crypto.randomUUID(),
    roles, role: roles[0] || null, permissions: [],
    jti: crypto.randomUUID(), iss: 'baalvion-auth', aud: 'baalvion-platform',
    iat: now, exp: now + 3600,
  };
  const input = b64url(JSON.stringify(header)) + '.' + b64url(JSON.stringify(payload));
  const sig = crypto.sign('RSA-SHA256', Buffer.from(input), PRIV);
  return input + '.' + b64url(sig);
}

function call(method, urlPath, token, body) {
  return new Promise((resolve) => {
    const payload = body !== undefined ? JSON.stringify(body) : null;
    const req = http.request({
      host: HOST, port: PORT, method, path: urlPath,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: 'Bearer ' + token } : {}),
        ...(payload ? { 'content-length': Buffer.byteLength(payload) } : {}),
      },
    }, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => { let d; try { d = JSON.parse(raw); } catch { d = raw; } resolve({ status: res.statusCode, data: d }); });
    });
    req.on('error', (e) => resolve({ status: 0, data: 'CONN_ERR: ' + e.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

const short = (o) => JSON.stringify(o).slice(0, 700);

(async () => {
  const buyer = mintToken({ sub: CUSTOMER_USER_ID, roles: ['end_user'] });
  const admin = mintToken({ sub: '9000099', roles: ['super_admin'] });
  const doRefund = process.argv.includes('--refund');

  console.log('\n=== STEP 1: create order (customer, 2 units) ===');
  const order = await call('POST', `/api/v1/orders/stores/${STORE}/orders`, buyer, {
    customerId: CUSTOMER, currencyCode: 'USD',
    items: [{ productId: PRODUCT, quantity: 2 }],
    idempotencyKey: 'warroom-' + Date.now(),
  });
  console.log('HTTP', order.status, short(order.data));
  const orderId = order.data && order.data.data && order.data.data.id;
  if (!orderId) { console.log('>> NO ORDER ID — stopping'); return; }
  console.log('>> orderId =', orderId, '| total =', order.data.data.totalAmount, '| paymentStatus =', order.data.data.paymentStatus);

  console.log('\n=== STEP 2: create payment intent ===');
  const intent = await call('POST', `/api/v1/orders/stores/${STORE}/orders/${orderId}/payments/intent`, buyer);
  console.log('HTTP', intent.status, short(intent.data));
  const intentId = intent.data && intent.data.data && intent.data.data.intentId;
  if (!intentId) { console.log('>> NO INTENT — stopping (this is the BEFORE-fix blocker if HTTP 500)'); return; }

  console.log('\n=== STEP 3: confirm payment (backend-authoritative capture) ===');
  const confirm = await call('POST', `/api/v1/orders/stores/${STORE}/orders/${orderId}/payments/confirm`, buyer, { intentId });
  console.log('HTTP', confirm.status, short(confirm.data));

  console.log('\n=== STEP 4: verify order is PAID ===');
  const got = await call('GET', `/api/v1/orders/stores/${STORE}/orders/${orderId}`, buyer);
  const o = got.data && got.data.data;
  console.log('HTTP', got.status, '| paymentStatus =', o && o.paymentStatus, '| status =', o && o.status, '| total =', o && o.totalAmount);

  console.log('\n=== STEP 5: idempotent re-confirm (must NOT double-capture) ===');
  const reconf = await call('POST', `/api/v1/orders/stores/${STORE}/orders/${orderId}/payments/confirm`, buyer, { intentId });
  console.log('HTTP', reconf.status, '| paymentStatus =', reconf.data && reconf.data.data && reconf.data.data.paymentStatus);

  if (doRefund) {
    console.log('\n=== STEP 6: refund (admin / super_admin — needs rbac-service) ===');
    const refund = await call('POST', `/api/v1/orders/stores/${STORE}/orders/${orderId}/refund`, admin, { reason: 'warroom-test' });
    console.log('HTTP', refund.status, short(refund.data));
    const after = await call('GET', `/api/v1/orders/stores/${STORE}/orders/${orderId}`, admin);
    console.log('after refund paymentStatus =', after.data && after.data.data && after.data.data.paymentStatus);
  }

  console.log('\n=== DONE ===');
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
