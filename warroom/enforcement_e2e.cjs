'use strict';
/**
 * War-room authorization E2E (P1 #4 cross-customer isolation, #5 store-role enforcement, refund).
 * Drives the LIVE order-service (:3013) which now consults the LIVE rbac-service (:3055) PDP.
 */
const { mintToken, STORE, http } = require('./mint.cjs');
const fx = require('./fixtures.cjs');
const PORT = Number(process.env.OS_PORT) || 3013;
const PRODUCT = fx.product;
const CUSTOMER = fx.customer; // owned by user 9000001
const api = (m, p, tok, body) => http(m, `/api/v1${p}`, tok, body, PORT);
const short = (o) => JSON.stringify(o).slice(0, 240);

async function createPaidOrder(buyerTok) {
  const o = await api('POST', `/orders/stores/${STORE}/orders`, buyerTok, {
    customerId: CUSTOMER, currencyCode: 'USD', items: [{ productId: PRODUCT, quantity: 1 }], idempotencyKey: 'enf-' + Date.now() + '-' + Math.floor(performance.now()),
  });
  const id = o.data?.data?.id;
  const intent = await api('POST', `/orders/stores/${STORE}/orders/${id}/payments/intent`, buyerTok);
  const intentId = intent.data?.data?.intentId;
  await api('POST', `/orders/stores/${STORE}/orders/${id}/payments/confirm`, buyerTok, { intentId });
  return id;
}

(async () => {
  const buyer1 = mintToken({ sub: '9000001', roles: ['end_user'] });   // owns CUSTOMER
  const buyer2 = mintToken({ sub: '9000002', roles: ['end_user'] });   // a different shopper
  const ops    = mintToken({ sub: '9000099', roles: ['end_user'] });   // ops_manager@store (DB), token role irrelevant
  const viewer = mintToken({ sub: '9000088', roles: ['end_user'] });   // store_viewer@store (DB)

  const pass = (c) => (c ? 'PASS ✅' : 'FAIL ❌');

  console.log('=== P1 #5: admin order listing requires a store role ===');
  const listNoRole = await api('GET', `/orders/stores/${STORE}/orders`, buyer2);
  console.log('  end_user (no store role) lists orders ->', listNoRole.status, pass(listNoRole.status === 403));
  const listViewer = await api('GET', `/orders/stores/${STORE}/orders`, viewer);
  console.log('  store_viewer lists orders         ->', listViewer.status, pass(listViewer.status === 200));

  console.log('\n=== P1 #4: cross-customer order access is impossible (IDOR) ===');
  const oid = await createPaidOrder(buyer1);
  const ownerGet = await api('GET', `/orders/stores/${STORE}/orders/${oid}`, buyer1);
  console.log('  owner (9000001) GET own order     ->', ownerGet.status, pass(ownerGet.status === 200));
  const foreignGet = await api('GET', `/orders/stores/${STORE}/orders/${oid}`, buyer2);
  console.log('  other shopper (9000002) GET order ->', foreignGet.status, foreignGet.data?.error?.code, pass(foreignGet.status === 403));
  const foreignIntent = await api('POST', `/orders/stores/${STORE}/orders/${oid}/payments/intent`, buyer2);
  console.log('  other shopper create intent       ->', foreignIntent.status, pass(foreignIntent.status === 403));

  console.log('\n=== P1 #5 + refund: store-role enforcement on refund ===');
  const refundViewer = await api('POST', `/orders/stores/${STORE}/orders/${oid}/refund`, viewer, { reason: 'test' });
  console.log('  store_viewer refund (needs ops)   ->', refundViewer.status, refundViewer.data?.error?.code, pass(refundViewer.status === 403));
  const stillPaid = await api('GET', `/orders/stores/${STORE}/orders/${oid}`, ops);
  console.log('  order still paid after denied      ->', stillPaid.data?.data?.paymentStatus, pass(stillPaid.data?.data?.paymentStatus === 'paid'));
  const refundOps = await api('POST', `/orders/stores/${STORE}/orders/${oid}/refund`, ops, { reason: 'warroom-refund' });
  console.log('  ops_manager refund                 ->', refundOps.status, short(refundOps.data));
  const afterRefund = await api('GET', `/orders/stores/${STORE}/orders/${oid}`, ops);
  console.log('  order paymentStatus after refund   ->', afterRefund.data?.data?.paymentStatus, pass(afterRefund.data?.data?.paymentStatus === 'refunded'));

  console.log('\n=== DONE ===');
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
