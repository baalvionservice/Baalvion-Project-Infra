'use strict';
/**
 * Warehouse Management System, Phase A —
 * service/warehouse/receivingLifecycle.js verification. Pure, no DB.
 * Structural clone of tests/logistics-fleet-lifecycle.verify.js.
 *
 *   node tests/wms-receiving-lifecycle.verify.js
 */
const assert = require('assert');
const { VALID_TRANSITIONS, STATUSES, canTransition, assertTransition } = require('../service/warehouse/receivingLifecycle');

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

t('exposes the 4 canonical statuses', () => {
    assert.deepStrictEqual(STATUSES, ['draft', 'in_progress', 'completed', 'cancelled']);
});

t('draft -> in_progress -> completed is the happy path', () => {
    assert.strictEqual(canTransition('draft', 'in_progress'), true);
    assert.strictEqual(canTransition('in_progress', 'completed'), true);
});

t('cancellation is allowed from both open states', () => {
    assert.strictEqual(canTransition('draft', 'cancelled'), true);
    assert.strictEqual(canTransition('in_progress', 'cancelled'), true);
});

t('completed and cancelled are terminal — no outgoing transitions', () => {
    assert.deepStrictEqual(VALID_TRANSITIONS.completed, []);
    assert.deepStrictEqual(VALID_TRANSITIONS.cancelled, []);
    assert.strictEqual(canTransition('completed', 'draft'), false);
    assert.strictEqual(canTransition('cancelled', 'in_progress'), false);
});

t('cannot skip straight from draft to completed', () => {
    assert.strictEqual(canTransition('draft', 'completed'), false);
});

t('assertTransition throws INVALID_TRANSITION on an illegal move', () => {
    assert.throws(() => assertTransition('completed', 'in_progress'), (err) => err.code === 'INVALID_TRANSITION');
});

t('assertTransition does not throw on a legal move', () => {
    assert.doesNotThrow(() => assertTransition('draft', 'in_progress'));
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Receiving (GRN) lifecycle — ${pass} passed, ${fail} failed`);
if (fail > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f.name}: ${f.message}`);
    process.exit(1);
}
process.exit(0);
