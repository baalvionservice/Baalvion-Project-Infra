'use strict';
/**
 * Logistics Core Foundation (Phase 1) — verifies the additive granular
 * sub-stages in service/workflow/stateMachine.js are both USABLE and
 * NON-BREAKING (the original happy path's canonical /advance target for
 * every state it already covered must be unchanged). Pure, no DB.
 *
 *   node tests/workflow-extended.verify.js
 */
const assert = require('assert');
const sm = require('../service/workflow/stateMachine');

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

section('non-breaking guarantee');
t('original happy-path canonical /advance targets are unchanged', () => {
    // These are the exact FORWARD_EVENT_BY_STATE entries the original 13-state
    // machine had. New granular events also list some of these states in their
    // own `from` arrays (e.g. assign_carrier includes FREIGHT_BOOKED), so this
    // proves the first-write-wins reduce in stateMachine.js protects them.
    assert.strictEqual(sm.FORWARD_EVENT_BY_STATE.FREIGHT_BOOKED, 'ready_dispatch');
    assert.strictEqual(sm.FORWARD_EVENT_BY_STATE.DISPATCH_READY, 'dispatch');
    assert.strictEqual(sm.FORWARD_EVENT_BY_STATE.IN_TRANSIT, 'deliver');
    assert.strictEqual(sm.nextForwardState('FREIGHT_BOOKED'), 'DISPATCH_READY');
    assert.strictEqual(sm.nextForwardState('DISPATCH_READY'), 'DISPATCHED');
    assert.strictEqual(sm.nextForwardState('IN_TRANSIT'), 'DELIVERED');
});
t('the original 11-step happy path still decides identically', () => {
    const HAPPY_PATH = [
        ['CREATED', 'collect_documents', 'DOCUMENT_COLLECTION'],
        ['DOCUMENT_COLLECTION', 'submit_documents', 'DOCUMENT_VERIFICATION'],
        ['DOCUMENT_VERIFICATION', 'verify_documents', 'COMPLIANCE_CHECK'],
        ['COMPLIANCE_CHECK', 'clear_compliance', 'HS_CLASSIFICATION'],
        ['HS_CLASSIFICATION', 'classify_hs', 'CUSTOMS_READY'],
        ['CUSTOMS_READY', 'book_freight', 'FREIGHT_BOOKED'],
        ['FREIGHT_BOOKED', 'ready_dispatch', 'DISPATCH_READY'],
        ['DISPATCH_READY', 'dispatch', 'DISPATCHED'],
        ['DISPATCHED', 'depart', 'IN_TRANSIT'],
        ['IN_TRANSIT', 'deliver', 'DELIVERED'],
        ['DELIVERED', 'complete', 'COMPLETED'],
    ];
    let state = sm.INITIAL_STATE;
    for (const [from, event, to] of HAPPY_PATH) {
        assert.strictEqual(state, from);
        const d = sm.decide(state, event);
        assert.strictEqual(d.ok, true);
        assert.strictEqual(d.to, to);
        state = d.to;
    }
    assert.strictEqual(state, 'COMPLETED');
});

section('granular sub-stage chain');
t('full carrier-assignment + pickup + stuffing chain reaches DISPATCHED', () => {
    let d = sm.decide('FREIGHT_BOOKED', 'assign_carrier');
    assert.strictEqual(d.ok, true); assert.strictEqual(d.to, 'CARRIER_ASSIGNED');
    d = sm.decide(d.to, 'ready_dispatch');
    assert.strictEqual(d.ok, true); assert.strictEqual(d.to, 'DISPATCH_READY');
    d = sm.decide(d.to, 'schedule_pickup');
    assert.strictEqual(d.ok, true); assert.strictEqual(d.to, 'PICKUP_SCHEDULED');
    d = sm.decide(d.to, 'pick_up');
    assert.strictEqual(d.ok, true); assert.strictEqual(d.to, 'PICKED_UP');
    d = sm.decide(d.to, 'stuff_container');
    assert.strictEqual(d.ok, true); assert.strictEqual(d.to, 'CONTAINER_STUFFING');
    d = sm.decide(d.to, 'dispatch');
    assert.strictEqual(d.ok, true); assert.strictEqual(d.to, 'DISPATCHED');
});
t('cannot skip pick_up by dispatching straight from PICKUP_SCHEDULED', () => {
    const d = sm.decide('PICKUP_SCHEDULED', 'dispatch');
    assert.strictEqual(d.ok, false);
    assert.strictEqual(d.code, 'INVALID_TRANSITION');
});
t('transshipment can loop back to IN_TRANSIT any number of times', () => {
    let d = sm.decide('IN_TRANSIT', 'transship');
    assert.strictEqual(d.ok, true); assert.strictEqual(d.to, 'TRANSSHIPMENT');
    d = sm.decide(d.to, 'resume_transit');
    assert.strictEqual(d.ok, true); assert.strictEqual(d.to, 'IN_TRANSIT');
});
t('port arrival + out-for-delivery both lead to DELIVERED', () => {
    let d = sm.decide('IN_TRANSIT', 'arrive_port');
    assert.strictEqual(d.ok, true); assert.strictEqual(d.to, 'PORT_ARRIVAL');
    d = sm.decide(d.to, 'out_for_delivery');
    assert.strictEqual(d.ok, true); assert.strictEqual(d.to, 'OUT_FOR_DELIVERY');
    d = sm.decide(d.to, 'deliver');
    assert.strictEqual(d.ok, true); assert.strictEqual(d.to, 'DELIVERED');
});
t('universal fail still reaches every new sub-stage', () => {
    for (const state of ['CARRIER_ASSIGNED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'CONTAINER_STUFFING', 'TRANSSHIPMENT', 'PORT_ARRIVAL', 'OUT_FOR_DELIVERY']) {
        const d = sm.decide(state, 'fail');
        assert.strictEqual(d.ok, true, `fail should be allowed from ${state}`);
        assert.strictEqual(d.to, 'FAILED');
    }
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Workflow extension (Logistics Core Foundation) — ${pass} passed, ${fail} failed`);
if (fail > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f.name}: ${f.message}`);
    process.exit(1);
}
process.exit(0);
