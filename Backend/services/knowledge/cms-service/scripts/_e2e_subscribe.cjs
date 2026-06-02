'use strict';
/* Verify sdk.events.subscribe (the reworked redis-streams consumer path): a durable
 * group receives matching events via the SDK facade, with traceId+tenantId intact. */
const assert = require('assert');
const { createSdk } = require('@baalvion/sdk');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
    const RUN = String(Date.now());
    const sdk = await createSdk({
        service: 'notification-sim', cms: { baseUrl: 'http://localhost:3018/api/v1', internalSecret: 'x' },
        internalAuth: { secret: 'x' }, eventBus: { transport: 'redis' }, logLevel: 'info',
    });

    const received = [];
    const sub = await sdk.events.subscribe('payment.>', `e2e-sub-${RUN}`, (e) => { received.push(e); });
    await sleep(300); // let the consumer loop start

    await sdk.trace.runWith({ traceId: `sub-trace-${RUN}`, tenantId: 'baalvionstack-shop' }, async () => {
        await sdk.events.publish('payment.captured', { amount: 2000, currency: 'USD' }, { tenantId: 'baalvionstack-shop' });
    });
    // also publish a NON-matching event to confirm the pattern filter
    await sdk.events.publish('cms.integration.updated', { websiteSlug: 'x' }, { tenantId: 'x' });

    for (let i = 0; i < 20 && received.length < 1; i++) await sleep(300);

    assert(received.length >= 1, 'subscriber received the payment event');
    const e = received.find((x) => x.eventType === 'payment.captured');
    assert(e, 'received payment.captured via sdk.events.subscribe');
    assert.strictEqual(e.traceId, `sub-trace-${RUN}`, 'traceId intact through subscribe');
    assert.strictEqual(e.tenantId, 'baalvionstack-shop', 'tenantId intact through subscribe');
    assert(!received.some((x) => x.eventType === 'cms.integration.updated'), 'non-matching event filtered out by pattern');
    console.log(`[subscribe] received ${received.length} event(s); payment.captured eventType=${e.eventType} traceId=${e.traceId} tenantId=${e.tenantId}`);
    console.log('cms.integration.updated correctly filtered (pattern payment.>)');

    await sub.unsubscribe();
    await sdk.close();
    console.log('\nSDK.EVENTS.SUBSCRIBE E2E: PASS ✓');
    process.exit(0);
}
main().catch((e) => { console.error('FAIL:', e && e.message); process.exit(1); });
