'use strict';
/* Validation: notification-service consumes the platform bus via sdk.events.subscribe,
 * processes cms.* + payment.* with traceId/tenantId intact, emits lifecycle events,
 * is idempotent on redelivery, and stays compatible with an independent (audit-like) group. */
const assert = require('assert');
const redis = require('../config/redis');
const { initSdk } = require('../platform/sdk');
const eventConsumer = require('../workers/eventConsumer');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
    await redis.connect();
    const sdk = await initSdk(); // redis transport
    const RUN = String(Date.now());

    const lifecycle = [];
    const lcSub = await sdk.events.subscribe('notification.>', `val-lifecycle-${RUN}`, (e) => { lifecycle.push(e); });
    const auditSeen = [];
    const auditSub = await sdk.events.subscribe('>', `val-audit-${RUN}`, (e) => {
        if (e.eventType === 'cms.integration.updated' || e.eventType === 'payment.ledger.recorded') auditSeen.push(e);
    });

    // Start the REAL notification consumer (group 'notification-service', pattern '>').
    await eventConsumer.startEventConsumer();
    await sleep(500);

    // Publish the two domain events with trace contexts (as CMS / payment-service would).
    await sdk.trace.runWith({ traceId: `tr-cms-${RUN}`, tenantId: 'proxy-baalvionstack' }, async () => {
        await sdk.events.publish('cms.integration.updated', { websiteSlug: 'proxy-baalvionstack', provider: 'razorpay' }, { tenantId: 'proxy-baalvionstack' });
    });
    await sdk.trace.runWith({ traceId: `tr-pay-${RUN}`, tenantId: 'baalvion-elite-circle' }, async () => {
        await sdk.events.publish('payment.ledger.recorded', { tenantId: 'baalvion-elite-circle', amount: 2000, currency: 'USD' }, { tenantId: 'baalvion-elite-circle' });
    });

    // Select THIS run's events by traceId (the shared stream carries backlog from
    // prior runs — match precisely rather than by type).
    for (let i = 0; i < 25; i++) {
        const haveLc = lifecycle.some((e) => e.traceId === `tr-cms-${RUN}`) && lifecycle.some((e) => e.traceId === `tr-pay-${RUN}`);
        const haveAudit = auditSeen.some((e) => e.traceId === `tr-cms-${RUN}`) && auditSeen.some((e) => e.traceId === `tr-pay-${RUN}`);
        if (haveLc && haveAudit) break;
        await sleep(300);
    }

    const cmsLc = lifecycle.find((e) => e.traceId === `tr-cms-${RUN}`);
    const payLc = lifecycle.find((e) => e.traceId === `tr-pay-${RUN}`);
    assert(cmsLc, 'notification emitted lifecycle for cms.integration.updated (processed it)');
    assert(payLc, 'notification emitted lifecycle for payment.ledger.recorded (processed it)');
    assert.strictEqual(cmsLc.payload.sourceEvent, 'cms.integration.updated', 'cms lifecycle sourceEvent');
    assert.strictEqual(payLc.payload.sourceEvent, 'payment.ledger.recorded', 'payment lifecycle sourceEvent');
    assert.strictEqual(cmsLc.payload.tenantId, 'proxy-baalvionstack', 'cms lifecycle tenantId intact');
    assert.strictEqual(payLc.payload.tenantId, 'baalvion-elite-circle', 'payment lifecycle tenantId intact');
    assert.strictEqual(cmsLc.tenantId, 'proxy-baalvionstack', 'cms lifecycle event-level tenantId intact');
    console.log('[1] notification consumed + processed BOTH domain events via sdk.events.subscribe');
    console.log(`[2] lifecycle emitted, traceId+tenantId intact: cms{${cmsLc.payload.tenantId},${cmsLc.traceId}} pay{${payLc.payload.tenantId},${payLc.traceId}}`);

    assert(auditSeen.find((e) => e.traceId === `tr-cms-${RUN}`), 'audit-like group received THIS run cms event');
    assert(auditSeen.find((e) => e.traceId === `tr-pay-${RUN}`), 'audit-like group received THIS run payment event');
    console.log('[3] independent (audit-style) group received the SAME events — consumer compatibility preserved');

    // Idempotency: handle the SAME event id twice → second is skipped. Count only
    // THIS dup event's lifecycle emissions (by its unique traceId), backlog-proof.
    const idemTrace = `tr-idem-${RUN}`;
    const countIdem = () => lifecycle.filter((e) => e.traceId === idemTrace).length;
    const dup = { id: `idem-${RUN}`, eventType: 'payment.captured', tenantId: 'baalvion-elite-circle', traceId: idemTrace, userId: null, payload: { amount: 100 } };
    await eventConsumer.handle(dup);
    await sleep(800);
    const afterFirst = countIdem();
    await eventConsumer.handle(dup); // redelivery of the SAME event id
    await sleep(800);
    const afterSecond = countIdem();
    assert.strictEqual(afterFirst, 1, 'first handle processed once');
    assert.strictEqual(afterSecond, 1, 'second handle (same id) SKIPPED — idempotent, no duplicate');
    console.log('[4] idempotency: redelivered event processed exactly once (no duplicate)');

    await lcSub.unsubscribe(); await auditSub.unsubscribe(); await eventConsumer.stopEventConsumer();
    await sdk.close();
    console.log('\nNOTIFICATION-SERVICE SDK ADOPTION VALIDATION: ALL PASS ✓');
    process.exit(0);
}
main().catch((e) => { console.error('VALIDATION FAIL:', e && (e.stack || e.message) || e); process.exit(1); });
