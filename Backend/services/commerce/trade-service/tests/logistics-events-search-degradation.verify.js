'use strict';
/**
 * Logistics Core Foundation (Phase 4) — verifies service/events/logisticsEvents.js
 * and service/search/logisticsIndexer.js degrade gracefully (no throw, no DB
 * write attempted) when @baalvion/events / @baalvion/search aren't installed —
 * the actual state of this environment until `pnpm install` + the packages'
 * `tsup` build run (see the Phase 4 summary). Pure, no DB.
 *
 *   node tests/logistics-events-search-degradation.verify.js
 */
const assert = require('assert');
const { emitLogisticsEvent, startLogisticsEventRelay, stopLogisticsEventRelay } = require('../service/events/logisticsEvents');
const { indexShipment, indexContainer, deleteShipmentFromIndex, deleteContainerFromIndex } = require('../service/search/logisticsIndexer');

let pass = 0;
let fail = 0;
const failures = [];

async function t(name, fn) {
    try {
        await fn();
        pass += 1;
        console.log(`  ✓ ${name}`);
    } catch (err) {
        fail += 1;
        failures.push({ name, message: err.message });
        console.log(`  ✗ ${name}\n      ${err.message}`);
    }
}

(async () => {
    await t('emitLogisticsEvent resolves without throwing when @baalvion/events is absent', async () => {
        await emitLogisticsEvent('logisticsContainerStatusChanged', {
            containerId: 'c1', shipmentId: null, previousStatus: 'empty', newStatus: 'loaded', tenantId: 'T-DEMO',
        });
    });
    await t('emitLogisticsEvent resolves for an unknown builder name too', async () => {
        await emitLogisticsEvent('notARealBuilder', {});
    });
    await t('startLogisticsEventRelay resolves to null (no-op) when @baalvion/events is absent', async () => {
        const handle = await startLogisticsEventRelay();
        assert.strictEqual(handle, null);
    });
    await t('stopLogisticsEventRelay resolves without throwing', async () => {
        await stopLogisticsEventRelay();
    });
    await t('indexShipment resolves without throwing when @baalvion/search is absent', async () => {
        await indexShipment({ id: 's1', shipment_no: 'SHP-1', status: 'booked', tenant_id: 'T-DEMO' });
    });
    await t('indexContainer resolves without throwing when @baalvion/search is absent', async () => {
        await indexContainer({ id: 'c1', container_number: 'X1', container_type: '20ft', status: 'empty', tenant_id: 'T-DEMO' });
    });
    await t('deleteShipmentFromIndex / deleteContainerFromIndex resolve without throwing', async () => {
        await deleteShipmentFromIndex('s1');
        await deleteContainerFromIndex('c1');
    });

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Logistics events/search graceful degradation — ${pass} passed, ${fail} failed`);
    if (fail > 0) {
        console.log('\nFailures:');
        for (const f of failures) console.log(`  - ${f.name}: ${f.message}`);
        process.exit(1);
    }
    process.exit(0);
})();
