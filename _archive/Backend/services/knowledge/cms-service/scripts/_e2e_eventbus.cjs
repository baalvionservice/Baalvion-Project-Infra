'use strict';
/* E2E: sdk.events (redis transport) → baalvion:events → consumer-group delivery.
 * Proves CMS + payment events reach the live stream in a format the
 * notification-service + audit-service consumers parse, with traceId+tenantId intact. */
const assert = require('assert');
const Redis = require('ioredis');
const { createSdk } = require('@baalvion/sdk');

const STREAM = 'baalvion:events';
const RUN = String(Date.now());
const TRACE_CMS = `evt-cms-${RUN}`;
const TRACE_PAY = `evt-pay-${RUN}`;

// The EXACT field-extraction both real consumers use (eventConsumer.processMessage).
function parseEntry(fields) {
    const data = {};
    for (let i = 0; i < fields.length; i += 2) data[fields[i]] = fields[i + 1];
    let payload = {};
    try { payload = JSON.parse(data._payload || '{}'); } catch { /* {} */ }
    return { data, payload };
}
// audit-service toAuditEvent (key fields) — traceId survival via meta._correlationId.
function auditOf(data, payload) {
    return { action: data._type || 'event', correlationId: data._correlationId ?? payload.traceId ?? null, tenantId: payload.tenantId ?? data._orgId ?? null };
}

async function main() {
    const sdk = await createSdk({
        service: 'cms-service',
        cms: { baseUrl: 'http://localhost:3018/api/v1', internalSecret: 'x' },
        internalAuth: { secret: 'x' },
        eventBus: { transport: 'redis' },
        logLevel: 'info',
    });

    // Publish inside trace contexts so traceId + tenantId flow from sdk.trace.
    await sdk.trace.runWith({ traceId: TRACE_CMS, tenantId: 'baalvion-mining' }, async () => {
        await sdk.events.publish('cms.integration.updated', { websiteSlug: 'baalvion-mining', provider: 'razorpay', status: 'configured' }, { tenantId: 'baalvion-mining' });
    });
    await sdk.trace.runWith({ traceId: TRACE_PAY, tenantId: 'baalvionstack-shop' }, async () => {
        await sdk.events.publish('payment.ledger.recorded', { tenantId: 'baalvionstack-shop', provider: 'stripe', amount: 2000, currency: 'USD', transactionId: 'txn-e2e' }, { tenantId: 'baalvionstack-shop' });
    });
    console.log('[publish] cms.integration.updated + payment.ledger.recorded → baalvion:events');
    await sdk.close();

    const r = new Redis({ host: 'localhost', port: 6379 });
    // Two independent consumer groups (same stream, same XREADGROUP semantics the
    // real notification-service + audit-service use). Unique names → deterministic,
    // no interference with running services.
    for (const group of [`e2e-notif-${RUN}`, `e2e-audit-${RUN}`]) {
        try { await r.xgroup('CREATE', STREAM, group, '0', 'MKSTREAM'); }
        catch (e) { if (!String(e.message).includes('BUSYGROUP')) throw e; }

        const found = {};
        // drain until we have both our events
        for (let i = 0; i < 50 && Object.keys(found).length < 2; i++) {
            const res = await r.xreadgroup('GROUP', group, `${group}-c`, 'COUNT', 100, 'STREAMS', STREAM, '>');
            if (!res) break;
            for (const [, messages] of res) {
                for (const [msgId, fields] of messages) {
                    const { data, payload } = parseEntry(fields);
                    if (data._correlationId === TRACE_CMS || data._correlationId === TRACE_PAY) {
                        found[data._type] = { data, payload };
                    }
                    await r.xack(STREAM, group, msgId);
                }
            }
        }

        // notification-style parse assertions
        const cms = found['cms.integration.updated'];
        const pay = found['payment.ledger.recorded'];
        assert(cms, `[${group}] received cms.integration.updated`);
        assert(pay, `[${group}] received payment.ledger.recorded`);
        assert.strictEqual(cms.data._correlationId, TRACE_CMS, 'cms traceId survived transport');
        assert.strictEqual(pay.data._correlationId, TRACE_PAY, 'payment traceId survived transport');
        assert.strictEqual(cms.payload.provider, 'razorpay', 'cms payload intact');
        assert.strictEqual(pay.payload.amount, 2000, 'payment payload intact');

        // tenantId preserved (envelope _orgId + full _event)
        const ev = JSON.parse(cms.data._event);
        assert.strictEqual(ev.orgId, 'baalvion-mining', 'tenantId preserved in PlatformEvent envelope');
        assert.strictEqual(ev.traceId, TRACE_CMS, 'traceId preserved in PlatformEvent envelope');

        // audit-service toAuditEvent parse
        const a = auditOf(pay.data, pay.payload);
        assert.strictEqual(a.action, 'payment.ledger.recorded', 'audit action = event type');
        assert.strictEqual(a.correlationId, TRACE_PAY, 'audit correlationId = traceId');
        assert.strictEqual(a.tenantId, 'baalvionstack-shop', 'audit tenantId resolved');

        console.log(`[${group}] received BOTH events · traceId intact · tenantId intact · audit-parse OK`);
        await r.xgroup('DESTROY', STREAM, group).catch(() => {});
    }
    await r.quit();
    console.log('\nEVENT-BUS E2E: ALL PASS ✓  (sdk.events → redis streams → consumer groups, traceId+tenantId preserved)');
}

main().catch((e) => { console.error('E2E FAIL:', e && e.message); process.exit(1); });
