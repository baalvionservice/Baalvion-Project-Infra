'use strict';
/* Rollout validation (batch 2): real payment flow for Proxy-BaalvionStack (razorpay)
 * + Baalvion Elite Circle (stripe), via the SDK-native payment-service only.
 * Scenarios per site: success, failed, cancelled, duplicate webhook, replay/tamper,
 * ledger-exactly-once, traceId propagation, tenant isolation. Emits a report. */
const assert = require('assert');
const razorpay = require('../gateway/adapters/razorpay');
const stripe = require('../gateway/adapters/stripe');

const BASE = process.env.PAY_BASE || 'http://localhost:3915';
const SECRET = process.env.INTERNAL_SERVICE_SECRET || 'baalvion-internal-dev-secret';
const RUN = String(Date.now()).slice(-9);
const ih = (extra = {}) => ({ 'content-type': 'application/json', 'x-internal-secret': SECRET, ...extra });
const report = [];
const rec = (site, scenario, ok, detail) => report.push({ site, scenario, result: ok ? 'PASS' : 'FAIL', detail });

const SITES = [
    {
        name: 'proxy-baalvionstack', provider: 'razorpay', amount: 50000, currency: 'INR', webhookSecret: 'rzp_whsec_proxy',
        webhook(kind, orderId, traceId) {
            const event = kind === 'success' ? 'payment.captured' : 'payment.failed';
            const body = { event, payload: { payment: { entity: { id: `pay_${kind}_${RUN}`, order_id: orderId, amount: 50000, currency: 'INR', error_reason: kind === 'cancelled' ? 'customer_cancelled' : undefined } } } };
            const rawBody = JSON.stringify(body);
            return { rawBody, sigHeader: 'x-razorpay-signature', headers: { 'content-type': 'application/json', 'x-razorpay-signature': razorpay.signWebhook({ rawBody, secrets: { webhookSecret: this.webhookSecret } }), 'x-trace-id': traceId } };
        },
    },
    {
        name: 'baalvion-elite-circle', provider: 'stripe', amount: 2000, currency: 'USD', webhookSecret: 'whsec_elite',
        webhook(kind, orderId, traceId) {
            const type = kind === 'success' ? 'payment_intent.succeeded' : (kind === 'cancelled' ? 'payment_intent.canceled' : 'payment_intent.payment_failed');
            const body = { id: `evt_${kind}_${RUN}`, type, data: { object: { id: orderId, amount: 2000, currency: 'usd', status: kind === 'success' ? 'succeeded' : 'requires_payment_method' } } };
            const rawBody = JSON.stringify(body);
            return { rawBody, sigHeader: 'stripe-signature', headers: { 'content-type': 'application/json', 'stripe-signature': stripe.signWebhook({ rawBody, secrets: { webhookSecret: this.webhookSecret } }), 'x-trace-id': traceId } };
        },
    },
];

async function createIntent(site, idemSuffix, traceId) {
    const res = await fetch(`${BASE}/v1/gateway/payments`, {
        method: 'POST', headers: ih({ 'x-trace-id': traceId }),
        body: JSON.stringify({ websiteSlug: site.name, amount: site.amount, currency: site.currency, idempotencyKey: `${site.name}-${idemSuffix}-${RUN}`, receipt: `r-${idemSuffix}-${RUN}` }),
    });
    return res.json();
}
const postWebhook = (site, wh) => fetch(`${BASE}/v1/gateway/webhooks/${site.provider}?site=${site.name}`, { method: 'POST', headers: wh.headers, body: wh.rawBody });
const getPayment = (site, id) => fetch(`${BASE}/v1/gateway/payments/${id}?site=${site.name}`, { headers: ih() }).then((r) => r.json());

async function runSite(site) {
    const trace = (k) => `roll-${site.name}-${k}-${RUN}`;

    // 1) SUCCESS
    {
        const c = await createIntent(site, 'ok', trace('ok'));
        const ok1 = c.data && c.data.provider === site.provider && c.data.providerOrderId;
        const wh = site.webhook('success', c.data.providerOrderId, trace('ok'));
        const w = await postWebhook(site, wh); const wb = await w.json();
        const got = await getPayment(site, c.data.payment.id);
        const ok = ok1 && w.status === 200 && wb.duplicate === false && got.data.status === 'captured' && got.data.ledgerEntries.length === 1 && got.data.ledgerEntries[0].traceId === trace('ok');
        rec(site.name, 'successful payment', ok, `provider=${c.data && c.data.provider} status=${got.data && got.data.status} ledger=${got.data && got.data.ledgerEntries.length} traceOK=${got.data && got.data.ledgerEntries[0] && got.data.ledgerEntries[0].traceId === trace('ok')}`);

        // 4) DUPLICATE webhook (replay same success) → deduped, ledger still 1
        const w2 = await postWebhook(site, wh); const w2b = await w2.json();
        const got2 = await getPayment(site, c.data.payment.id);
        rec(site.name, 'duplicate webhook ignored', w2b.duplicate === true && got2.data.ledgerEntries.length === 1, `duplicate=${w2b.duplicate} ledgerStillOnce=${got2.data.ledgerEntries.length}`);

        // 5) REPLAY/TAMPER protection → 401
        const bad = await postWebhook(site, { ...wh, headers: { ...wh.headers, [wh.sigHeader]: 'tampered000' } });
        rec(site.name, 'replay/tamper rejected (401)', bad.status === 401, `status=${bad.status}`);

        // ledger exactly once (explicit)
        rec(site.name, 'ledger recorded exactly once', got2.data.ledgerEntries.length === 1, `count=${got2.data.ledgerEntries.length}`);
    }

    // 2) FAILED payment
    {
        const c = await createIntent(site, 'fail', trace('fail'));
        const wh = site.webhook('failed', c.data.providerOrderId, trace('fail'));
        const w = await postWebhook(site, wh); await w.json();
        const got = await getPayment(site, c.data.payment.id);
        rec(site.name, 'failed payment', w.status === 200 && got.data.status === 'failed', `status=${got.data && got.data.status}`);
    }

    // 3) CANCELLED payment (modeled as a terminal non-capture → 'failed' in the state machine)
    {
        const c = await createIntent(site, 'cancel', trace('cancel'));
        const wh = site.webhook('cancelled', c.data.providerOrderId, trace('cancel'));
        const w = await postWebhook(site, wh); await w.json();
        const got = await getPayment(site, c.data.payment.id);
        rec(site.name, 'cancelled payment (→failed terminal)', w.status === 200 && got.data.status === 'failed', `status=${got.data && got.data.status}`);
    }
}

async function main() {
    for (const site of SITES) await runSite(site);

    // TENANT ISOLATION: a payment created for site A is not readable as site B.
    {
        const a = SITES[0], b = SITES[1];
        const c = await createIntent(a, 'iso', `roll-iso-${RUN}`);
        const cross = await fetch(`${BASE}/v1/gateway/payments/${c.data.payment.id}?site=${b.name}`, { headers: ih() });
        const same = await fetch(`${BASE}/v1/gateway/payments/${c.data.payment.id}?site=${a.name}`, { headers: ih() });
        rec('cross-tenant', 'tenant isolation (no leakage)', cross.status === 404 && same.status === 200, `crossSite=${cross.status} ownSite=${same.status}`);
    }

    // ── Report ──
    console.log('\n================ PAYMENT ROLLOUT VALIDATION REPORT ================');
    let pass = 0;
    for (const r of report) {
        if (r.result === 'PASS') pass++;
        console.log(`  [${r.result}] ${r.site.padEnd(22)} ${r.scenario.padEnd(34)} ${r.detail}`);
    }
    console.log(`------------------------------------------------------------------`);
    console.log(`  ${pass}/${report.length} checks passed`);
    console.log('==================================================================');
    if (pass !== report.length) { console.error('SOME CHECKS FAILED'); process.exit(1); }
    console.log('ALL ROLLOUT CHECKS PASSED ✓');
    process.exit(0);
}
main().catch((e) => { console.error('VALIDATION ERROR:', e && (e.stack || e.message)); process.exit(1); });
