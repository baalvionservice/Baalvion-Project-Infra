'use strict';
/**
 * Gateway payment E2E (P4): payment intent -> signed capture webhook -> merchant refund.
 * Drives the LIVE payment-service (host :3019) which resolves the provider + keys from the
 * CMS vault. Uses the REAL razorpay adapter to produce a valid webhook signature (mock mode
 * = real signature crypto, no live charge). Proves: internal-auth, CMS-vault resolution,
 * signed webhook -> captured, refund -> refunded + debit ledger, idempotent re-refund,
 * cross-tenant refund IDOR.
 */
const http = require('http');
const path = require('path');
const fx = require('./fixtures.cjs');
const razorpay = require(path.join(__dirname, '..', 'Backend', 'services', 'commerce', 'payment-service', 'gateway', 'adapters', 'razorpay'));

const PORT = Number(process.env.PAY_PORT) || 3019;
const SECRET = process.env.INTERNAL_SERVICE_SECRET || 'baalvion-internal-dev-secret';
const RUN = process.env.RUN_ID || String(process.hrtime.bigint()).slice(-10);

function send({ method, path, headers, json, raw }) {
  return new Promise((res) => {
    const body = raw !== undefined ? raw : (json !== undefined ? JSON.stringify(json) : null);
    const h = { 'content-type': 'application/json', ...(headers || {}), ...(body != null ? { 'content-length': Buffer.byteLength(body) } : {}) };
    const req = http.request({ host: '127.0.0.1', port: PORT, method, path, headers: h }, (r) => {
      let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => { let p; try { p = JSON.parse(d); } catch { p = d; } res({ status: r.statusCode, data: p }); });
    });
    req.on('error', (e) => res({ status: 0, data: e.message })); if (body != null) req.write(body); req.end();
  });
}
const internal = (extra = {}) => ({ 'x-internal-secret': SECRET, ...extra });
const pass = (c) => (c ? 'PASS ✅' : 'FAIL ❌');

(async () => {
  const site = fx.paymentSite, amount = 50000, currency = 'INR', webhookSecret = fx.paymentWebhookSecret;
  const idem = `refund-e2e-${RUN}`;
  console.log(`=== gateway payment E2E: ${site} (razorpay, mock mode) ===`);

  const noauth = await send({ method: 'POST', path: '/v1/gateway/payments', json: { websiteSlug: site, amount, currency, idempotencyKey: idem } });
  console.log('  [0] create WITHOUT internal-auth ->', noauth.status, pass(noauth.status === 401));

  const c = await send({ method: 'POST', path: '/v1/gateway/payments', headers: internal(), json: { websiteSlug: site, amount, currency, idempotencyKey: idem, receipt: `rcpt-${RUN}` } });
  const paymentId = c.data?.data?.payment?.id; const orderId = c.data?.data?.providerOrderId;
  console.log('  [1] create intent ->', c.status, '| provider=', c.data?.data?.provider, '| mode=', c.data?.data?.mode, '| order=', orderId, pass(c.status === 201 && c.data?.data?.provider === 'razorpay'));
  if (!paymentId) { console.log('  >> no paymentId — stopping'); return; }

  const whBody = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: `pay_${RUN}`, order_id: orderId, amount, currency } } } });
  const sig = razorpay.signWebhook({ rawBody: whBody, secrets: { webhookSecret } });
  const w = await send({ method: 'POST', path: `/v1/gateway/webhooks/razorpay?site=${site}`, headers: { 'x-razorpay-signature': sig }, raw: whBody });
  console.log('  [2] signed capture webhook ->', w.status, '| processed=', w.data?.processed, pass(w.status === 200 && w.data?.processed === true));

  const tampered = await send({ method: 'POST', path: `/v1/gateway/webhooks/razorpay?site=${site}`, headers: { 'x-razorpay-signature': 'deadbeef' }, raw: whBody });
  console.log('  [2b] tampered signature ->', tampered.status, pass(tampered.status === 401));

  const r1 = await send({ method: 'GET', path: `/v1/gateway/payments/${paymentId}?site=${site}`, headers: internal() });
  console.log('  [3] read after capture -> status=', r1.data?.data?.status, '| ledger=', r1.data?.data?.ledgerEntries?.length, pass(r1.data?.data?.status === 'captured'));

  const rf = await send({ method: 'POST', path: `/v1/gateway/payments/${paymentId}/refund?site=${site}`, headers: internal(), json: { reason: 'e2e-refund' } });
  console.log('  [4] REFUND ->', rf.status, '| refunded=', rf.data?.data?.refunded, '| providerRefundId=', rf.data?.data?.providerRefundId, pass(rf.status === 200 && rf.data?.data?.refunded === true));

  const r2 = await send({ method: 'GET', path: `/v1/gateway/payments/${paymentId}?site=${site}`, headers: internal() });
  const led = r2.data?.data?.ledgerEntries || [];
  const debit = led.find((e) => e.direction === 'debit' && e.status === 'refunded');
  console.log('  [5] read after refund -> status=', r2.data?.data?.status, '| debitLedgerEntry=', !!debit, '| ledgerCount=', led.length, pass(r2.data?.data?.status === 'refunded' && !!debit));

  const rf2 = await send({ method: 'POST', path: `/v1/gateway/payments/${paymentId}/refund?site=${site}`, headers: internal(), json: { reason: 'again' } });
  console.log('  [6] second refund (idempotent) ->', rf2.status, '| alreadyRefunded=', rf2.data?.data?.alreadyRefunded, pass(rf2.status === 200 && (rf2.data?.data?.alreadyRefunded || rf2.data?.data?.duplicate)));

  const idor = await send({ method: 'POST', path: `/v1/gateway/payments/${paymentId}/refund?site=${fx.crossTenantSite}`, headers: internal(), json: {} });
  console.log('  [7] cross-tenant refund (wrong site) ->', idor.status, pass(idor.status === 404));

  console.log('\n=== DONE ===');
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
