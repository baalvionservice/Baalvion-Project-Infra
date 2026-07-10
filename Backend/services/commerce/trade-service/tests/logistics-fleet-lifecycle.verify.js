'use strict';
/**
 * Logistics Core Foundation (Phase 2) — service/fleet/assignmentLifecycle.js
 * verification. Pure, no DB.
 *
 *   node tests/logistics-fleet-lifecycle.verify.js
 */
const assert = require('assert');
const { VALID_TRANSITIONS, STATUSES, canTransition, assertTransition } = require('../service/fleet/assignmentLifecycle');

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
    assert.deepStrictEqual(STATUSES, ['assigned', 'in_progress', 'completed', 'cancelled']);
});

t('assigned -> in_progress -> completed is the happy path', () => {
    assert.strictEqual(canTransition('assigned', 'in_progress'), true);
    assert.strictEqual(canTransition('in_progress', 'completed'), true);
});

t('cancellation is allowed from both open states', () => {
    assert.strictEqual(canTransition('assigned', 'cancelled'), true);
    assert.strictEqual(canTransition('in_progress', 'cancelled'), true);
});

t('completed and cancelled are terminal — no outgoing transitions', () => {
    assert.deepStrictEqual(VALID_TRANSITIONS.completed, []);
    assert.deepStrictEqual(VALID_TRANSITIONS.cancelled, []);
    assert.strictEqual(canTransition('completed', 'assigned'), false);
    assert.strictEqual(canTransition('cancelled', 'in_progress'), false);
});

t('cannot skip straight from assigned to completed', () => {
    assert.strictEqual(canTransition('assigned', 'completed'), false);
});

t('assertTransition throws INVALID_TRANSITION on an illegal move', () => {
    assert.throws(() => assertTransition('completed', 'in_progress'), (err) => err.code === 'INVALID_TRANSITION');
});

t('assertTransition does not throw on a legal move', () => {
    assert.doesNotThrow(() => assertTransition('assigned', 'in_progress'));
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Fleet assignment lifecycle — ${pass} passed, ${fail} failed`);
if (fail > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f.name}: ${f.message}`);
    process.exit(1);
}
process.exit(0);
