'use strict';
/**
 * War-room revenue-path E2E harness (dependency-free).
 * Mints a valid RS256 platform JWT (hand-rolled, signs with the platform private key)
 * and drives the order-service checkout flow against the LIVE service on :3013.
 *
 * Flow: createOrder -> payment intent -> confirm -> verify PAID  [-> refund if --refund]
 * Evidence: prints HTTP status + body for every step. No fabrication.
 */
const http = require('http');
const { mintToken: portableMint } = require('../Backend/scripts/mint-token.cjs');
const fx = require('./fixtures.cjs');

const HOST = '127.0.0.1';
const PORT = Number(process.env.OS_PORT) || 3013;
const STORE = fx.store;
const PRODUCT = fx.product;
const CUSTOMER = fx.customer;
const CUSTOMER_USER_ID = fx.customerUserId;

const mintToken = ({ sub, roles }) => portableMint({ sub, roles, org: STORE });

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
