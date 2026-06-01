'use strict';
/* Phase-3 live E2E (v2): 2 websites, full payment → signed webhook → ledger → event.
 * Proves: CMS-vault key resolution, SDK internal-auth on the create/read API,
 * idempotency (no duplicate ledger), traceId propagation, signature rejection,
 * cross-tenant isolation (IDOR 404), and forward-only status (no downgrade). */
const assert = require('assert');
const razorpay = require('../gateway/adapters/razorpay');
const stripe = require('../gateway/adapters/stripe');

const BASE = process.env.PAY_BASE || 'http://localhost:3915';
const SECRET = process.env.INTERNAL_SERVICE_SECRET || 'baalvion-internal-dev-secret';
const RUN = String(Date.now()).slice(-9); // unique per run → re-runnable
const internalHeaders = (extra = {}) => ({ 'content-type': 'application/json', 'x-internal-secret': SECRET, ...extra });

const SITES = [
    {
        name: 'baalvion-mining', provider: 'razorpay', amount: 50000, currency: 'INR', webhookSecret: 'rzp_whsec_mining_e2e',
        mkWebhook(kind, orderId, traceId) {
            const event = kind === 'failed' ? 'payment.failed' : 'payment.captured';
            const body = { event, payload: { payment: { entity: { id: `pay_mining_${RUN}`, order_id: orderId, amount: 50000, currency: 'INR' } } } };
            const rawBody = JSON.stringify(body);
            return { rawBody, sigHeader: 'x-razorpay-signature', headers: internalHeadersless({ 'x-razorpay-signature': razorpay.signWebhook({ rawBody, secrets: { webhookSecret: this.webhookSecret } }), 'x-trace-id': traceId }) };
        },
    },
    {
        name: 'baalvionstack-shop', provider: 'stripe', amount: 2000, currency: 'USD', webhookSecret: 'whsec_stack_e2e',
        mkWebhook(kind, orderId, traceId) {
            const type = kind === 'failed' ? 'payment_intent.payment_failed' : 'payment_intent.succeeded';
            const body = { id: `evt_stack_${kind}_${RUN}`, type, data: { object: { id: orderId, amount: 2000, currency: 'usd', status: kind === 'failed' ? 'requires_payment_method' : 'succeeded' } } };
            const rawBody = JSON.stringify(body);
            return { rawBody, sigHeader: 'stripe-signature', headers: internalHeadersless({ 'stripe-signature': stripe.signWebhook({ rawBody, secrets: { webhookSecret: this.webhookSecret } }), 'x-trace-id': traceId }) };
        },
    },
];
// webhooks are PUBLIC (no internal-auth) — only content-type + signature + trace.
function internalHeadersless(extra) { return { 'content-type': 'application/json', ...extra }; }

async function main() {
    for (const s of SITES) {
        const traceId = `e2e-trace-${s.name}-${RUN}`;
        const idem = `e2e-${s.name}-${RUN}`;
        console.log(`\n=== ${s.name} (${s.provider}) ===`);

        // 0) Auth required: create without internal-auth → 401.
        const noAuth = await fetch(`${BASE}/v1/gateway/payments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ websiteSlug: s.name, amount: s.amount, currency: s.currency, idempotencyKey: idem }) });
        assert.strictEqual(noAuth.status, 401, `no internal-auth → 401 (got ${noAuth.status})`);
        console.log(`  [0] create without internal-auth → 401 (sdk.internalAuth enforced)`);

        // 1) Create intent — provider + keys resolved from the CMS vault.
        const cRes = await fetch(`${BASE}/v1/gateway/payments`, { method: 'POST', headers: internalHeaders({ 'x-trace-id': traceId }), body: JSON.stringify({ websiteSlug: s.name, amount: s.amount, currency: s.currency, idempotencyKey: idem, receipt: `rcpt-${s.name}-${RUN}` }) });
        const created = await cRes.json();
        assert.strictEqual(cRes.status, 201, `create 201 (got ${cRes.status}: ${JSON.stringify(created)})`);
        assert.strictEqual(created.data.provider, s.provider, `provider from CMS == ${s.provider}`);
        assert.ok(created.data.providerOrderId, 'providerOrderId present');
        const paymentId = created.data.payment.id;
        const orderId = created.data.providerOrderId;
        console.log(`  [1] intent: provider=${created.data.provider} mode=${created.data.mode} order=${orderId} paymentId=${paymentId.slice(0, 8)}`);

        // 2) Signed webhook (captured) → verify → ledger + status.
        const wh = s.mkWebhook('captured', orderId, traceId);
        const w1 = await (await fetch(`${BASE}/v1/gateway/webhooks/${s.provider}?site=${s.name}`, { method: 'POST', headers: wh.headers, body: wh.rawBody })).json();
        assert.strictEqual(w1.processed, true, 'webhook processed'); assert.strictEqual(w1.duplicate, false, 'not duplicate');
        console.log(`  [2] webhook captured: processed=${w1.processed} duplicate=${w1.duplicate}`);

        // 3) Replay → idempotent dedup.
        const w2 = await (await fetch(`${BASE}/v1/gateway/webhooks/${s.provider}?site=${s.name}`, { method: 'POST', headers: wh.headers, body: wh.rawBody })).json();
        assert.strictEqual(w2.duplicate, true, 'replay IS duplicate'); console.log(`  [3] replay: duplicate=${w2.duplicate}  ← dedup`);

        // 4) Read (tenant-scoped) → captured, 1 ledger entry, traceId propagated.
        const got = (await (await fetch(`${BASE}/v1/gateway/payments/${paymentId}?site=${s.name}`, { headers: internalHeaders() })).json()).data;
        assert.strictEqual(got.status, 'captured', `captured (got ${got.status})`);
        assert.strictEqual(got.ledgerEntries.length, 1, `1 ledger entry (got ${got.ledgerEntries.length})`);
        assert.strictEqual(got.ledgerEntries[0].traceId, traceId, 'ledger traceId propagated');
        console.log(`  [4] read: status=${got.status} ledger=${got.ledgerEntries.length} traceId=${got.ledgerEntries[0].traceId}`);

        // 5) Tampered signature → 401.
        const bad = await fetch(`${BASE}/v1/gateway/webhooks/${s.provider}?site=${s.name}`, { method: 'POST', headers: { ...wh.headers, [wh.sigHeader]: 'deadbeef' }, body: wh.rawBody });
        assert.strictEqual(bad.status, 401, `tampered sig → 401 (got ${bad.status})`); console.log(`  [5] tampered signature → ${bad.status}`);

        // 6) Cross-tenant IDOR: read with the WRONG tenant → 404.
        const other = s.name === 'baalvion-mining' ? 'baalvionstack-shop' : 'baalvion-mining';
        const idor = await fetch(`${BASE}/v1/gateway/payments/${paymentId}?site=${other}`, { headers: internalHeaders() });
        assert.strictEqual(idor.status, 404, `cross-tenant read → 404 (got ${idor.status})`); console.log(`  [6] cross-tenant read (site=${other}) → ${idor.status} (IDOR blocked)`);

        // 7) Forward-only status: a signed 'failed' webhook must NOT downgrade captured.
        const fwh = s.mkWebhook('failed', orderId, traceId);
        const w3 = await (await fetch(`${BASE}/v1/gateway/webhooks/${s.provider}?site=${s.name}`, { method: 'POST', headers: fwh.headers, body: fwh.rawBody })).json();
        assert.strictEqual(w3.processed, true, 'failed-webhook processed'); assert.strictEqual(w3.duplicate, false, 'failed is a distinct event');
        const after = (await (await fetch(`${BASE}/v1/gateway/payments/${paymentId}?site=${s.name}`, { headers: internalHeaders() })).json()).data;
        assert.strictEqual(after.status, 'captured', `status NOT downgraded (still captured, got ${after.status})`);
        assert.strictEqual(after.ledgerEntries.length, 2, `failed event still audited in ledger (got ${after.ledgerEntries.length})`);
        console.log(`  [7] late 'failed' webhook → status=${after.status} (no downgrade), ledger=${after.ledgerEntries.length} (audited)`);
    }
    console.log('\n2-WEBSITE LIVE E2E (v2, hardened): ALL PASS ✓');
}

main().catch((e) => { console.error('E2E FAIL:', e && e.message); process.exit(1); });
