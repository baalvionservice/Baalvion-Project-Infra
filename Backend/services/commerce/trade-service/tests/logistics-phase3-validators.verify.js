'use strict';
/**
 * Logistics Core Foundation (Phase 3) — Zod validator verification for
 * shipment charges, incidents, and returns. Pure, no DB.
 *
 *   node tests/logistics-phase3-validators.verify.js
 */
const assert = require('assert');
const { createShipmentChargeSchema } = require('../validators/shipmentCharge.schema');
const { createIncidentSchema } = require('../validators/incident.schema');
const { createReturnSchema } = require('../validators/return.schema');

let pass = 0;
let fail = 0;
const failures = [];

function t(name, fn) {
    try {
        fn();
        pass += 1;
        console.log(`  ✓ ${name}`);
    } catch (err) {
        fail += 1;
        failures.push({ name, message: err.message });
        console.log(`  ✗ ${name}\n      ${err.message}`);
    }
}
function section(title) { console.log(`\n${title}`); }

const UUID = '11111111-1111-1111-1111-111111111111';

section('shipmentCharge.schema');
t('accepts a valid charge with currency default', () => {
    const r = createShipmentChargeSchema.safeParse({ shipmentId: UUID, chargeType: 'freight', amount: 100 });
    assert.strictEqual(r.success, true);
    assert.strictEqual(r.data.currency, 'USD');
});
t('rejects an unknown chargeType', () => {
    const r = createShipmentChargeSchema.safeParse({ shipmentId: UUID, chargeType: 'bogus', amount: 100 });
    assert.strictEqual(r.success, false);
});
t('rejects a negative amount', () => {
    const r = createShipmentChargeSchema.safeParse({ shipmentId: UUID, chargeType: 'freight', amount: -1 });
    assert.strictEqual(r.success, false);
});

section('incident.schema');
t('accepts a valid incident with severity default', () => {
    const r = createIncidentSchema.safeParse({ shipmentId: UUID, incidentType: 'damage', description: 'crate crushed' });
    assert.strictEqual(r.success, true);
    assert.strictEqual(r.data.severity, 'medium');
});
t('rejects a missing description', () => {
    const r = createIncidentSchema.safeParse({ shipmentId: UUID, incidentType: 'damage' });
    assert.strictEqual(r.success, false);
});
t('rejects an unknown incidentType', () => {
    const r = createIncidentSchema.safeParse({ shipmentId: UUID, incidentType: 'sabotage', description: 'x' });
    assert.strictEqual(r.success, false);
});

section('return.schema');
t('accepts a valid return with quantity default', () => {
    const r = createReturnSchema.safeParse({ shipmentId: UUID, reason: 'damaged' });
    assert.strictEqual(r.success, true);
    assert.strictEqual(r.data.quantity, 1);
});
t('rejects a zero/negative quantity', () => {
    const r = createReturnSchema.safeParse({ shipmentId: UUID, reason: 'damaged', quantity: 0 });
    assert.strictEqual(r.success, false);
});
t('rejects an unknown reason', () => {
    const r = createReturnSchema.safeParse({ shipmentId: UUID, reason: 'because' });
    assert.strictEqual(r.success, false);
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Logistics Phase 3 validators — ${pass} passed, ${fail} failed`);
if (fail > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f.name}: ${f.message}`);
    process.exit(1);
}
process.exit(0);
