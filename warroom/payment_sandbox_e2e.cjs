'use strict';
/**
 * REAL provider SANDBOX E2E (Priority 2). Unlike payment_e2e.cjs (mock mode = real
 * crypto, no network), this drives a website whose CMS vault is flipped to a real
 * provider SANDBOX (test keys, config.mode='live'):
 *
 *   create-intent  -> REAL provider API call (Stripe PaymentIntents / Razorpay Orders)
 *   capture         -> a correctly provider-signed webhook (real signature scheme)
 *   refund          -> REAL provider refund API call
 *   idempotency     -> second refund is a no-op
 *
 * Prereq (flip the site first):
 *   node Backend/services/knowledge/cms-service/scripts/configureSandboxPayments.cjs --provider stripe --site baalvionstack-shop
 * Then (same secrets the vault holds, so the local webhook signature is valid):
 *   STRIPE_TEST_WEBHOOK_SECRET=whsec_xxx node warroom/payment_sandbox_e2e.cjs --provider stripe --site baalvionstack-shop
 *
 * For webhooks delivered by the provider itself, run `stripe listen --forward-to
 * http://localhost:3019/v1/gateway/webhooks/stripe?site=<slug>` and confirm the intent
 * in the Stripe dashboard instead of the local-signed step (see SANDBOX_GOLIVE.md).
 */
const http = require('http');
const path = require('path');

function arg(name, fb) { const i = process.argv.indexOf(`--${name}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fb; }
const PROVIDER = String(arg('provider', 'stripe')).toLowerCase();
const SITE = arg('site', PROVIDER === 'razorpay' ? 'baalvion-mining' : 'baalvionstack-shop');
const PORT = Number(process.env.PAY_PORT) || 3019;
const SECRET = process.env.INTERNAL_SERVICE_SECRET || 'baalvion-internal-dev-secret';
const RUN = process.env.RUN_ID || String(process.hrtime.bigint()).slice(-10);
const adapter = require(path.join(__dirname, '..', 'Backend', 'services', 'commerce', 'payment-service', 'gateway', 'adapters', PROVIDER));
const WEBHOOK_SECRET = PROVIDER === 'razorpay' ? process.env.RAZORPAY_TEST_WEBHOOK_SECRET : process.env.STRIPE_TEST_WEBHOOK_SECRET;

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

function buildSignedWebhook(orderId, amount, currency) {
  if (PROVIDER === 'razorpay') {
    const raw = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: `pay_${RUN}`, order_id: orderId, amount, currency } } } });
    return { raw, headers: { 'x-razorpay-signature': adapter.signWebhook({ rawBody: raw, secrets: { webhookSecret: WEBHOOK_SECRET } }) }, route: 'razorpay' };
  }
  // stripe payment_intent.succeeded
  const raw = JSON.stringify({ id: `evt_${RUN}`, type: 'payment_intent.succeeded', data: { object: { id: orderId, object: 'payment_intent', amount, currency } } });
  return { raw, headers: { 'stripe-signature': adapter.signWebhook({ rawBody: raw, secrets: { webhookSecret: WEBHOOK_SECRET } }) }, route: 'stripe' };
}

(async () => {
  console.log(`=== REAL SANDBOX E2E: ${SITE} (${PROVIDER}) on :${PORT} ===`);
  const amount = PROVIDER === 'razorpay' ? 50000 : 2000;
  const currency = PROVIDER === 'razorpay' ? 'INR' : 'usd';
  const idem = `sandbox-${PROVIDER}-${RUN}`;

  const c = await send({ method: 'POST', path: '/v1/gateway/payments', headers: internal(), json: { websiteSlug: SITE, amount, currency, idempotencyKey: idem, receipt: `rcpt-${RUN}` } });
  const mode = c.data?.data?.mode; const paymentId = c.data?.data?.payment?.id; const orderId = c.data?.data?.providerOrderId;
  console.log('  [1] create intent ->', c.status, '| provider=', c.data?.data?.provider, '| mode=', mode, '| providerOrderId=', orderId, pass(c.status === 201));
  if (mode !== 'live') {
    console.log(`  >> site "${SITE}" is still in MOCK mode. Flip it first:`);
    console.log(`     node Backend/services/knowledge/cms-service/scripts/configureSandboxPayments.cjs --provider ${PROVIDER} --site ${SITE}`);
    return;
  }
  console.log('  >> create-intent reached the REAL provider (test mode) ✅');
  if (!paymentId) { console.log('  >> no paymentId — stopping'); return; }

  if (!WEBHOOK_SECRET) {
    console.log(`  [2] SKIPPED webhook capture — set ${PROVIDER === 'razorpay' ? 'RAZORPAY_TEST_WEBHOOK_SECRET' : 'STRIPE_TEST_WEBHOOK_SECRET'} (same value the vault holds).`);
    console.log('      Or use `stripe listen --forward-to ...` + confirm in the dashboard. See SANDBOX_GOLIVE.md.');
    return;
  }
  const wh = buildSignedWebhook(orderId, amount, currency);
  const w = await send({ method: 'POST', path: `/v1/gateway/webhooks/${wh.route}?site=${SITE}`, headers: wh.headers, raw: wh.raw });
  console.log('  [2] provider-signed capture webhook ->', w.status, '| processed=', w.data?.processed, pass(w.status === 200 && w.data?.processed === true));

  const r1 = await send({ method: 'GET', path: `/v1/gateway/payments/${paymentId}?site=${SITE}`, headers: internal() });
  console.log('  [3] read after capture -> status=', r1.data?.data?.status, pass(r1.data?.data?.status === 'captured'));

  const rf = await send({ method: 'POST', path: `/v1/gateway/payments/${paymentId}/refund?site=${SITE}`, headers: internal(), json: { reason: 'sandbox-refund' } });
  console.log('  [4] REFUND (REAL provider API) ->', rf.status, '| refunded=', rf.data?.data?.refunded, '| providerRefundId=', rf.data?.data?.providerRefundId, pass(rf.status === 200 && rf.data?.data?.refunded === true));

  const rf2 = await send({ method: 'POST', path: `/v1/gateway/payments/${paymentId}/refund?site=${SITE}`, headers: internal(), json: {} });
  console.log('  [5] second refund (idempotent) ->', rf2.status, '| alreadyRefunded=', rf2.data?.data?.alreadyRefunded, pass(rf2.status === 200 && (rf2.data?.data?.alreadyRefunded || rf2.data?.data?.duplicate)));

  console.log('\n=== DONE (real provider sandbox transaction completed) ===');
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
