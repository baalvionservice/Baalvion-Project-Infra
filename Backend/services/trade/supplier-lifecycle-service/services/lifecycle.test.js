'use strict';
// Unit tests for the pure supplier lifecycle state machine.
// No DB or network — runs under `node --test`.
const test = require('node:test');
const assert = require('node:assert');
const { STAGE_FLOW, canTransition } = require('./lifecycle');

test('STAGE_FLOW exposes every lifecycle stage', () => {
    const stages = ['prospect', 'onboarding', 'qualified', 'active', 'suspended', 'offboarded', 'blacklisted'];
    for (const stage of stages) {
        assert.ok(Object.prototype.hasOwnProperty.call(STAGE_FLOW, stage), `missing stage: ${stage}`);
    }
});

test('STAGE_FLOW is frozen (immutable)', () => {
    assert.ok(Object.isFrozen(STAGE_FLOW));
});

test('canTransition allows the documented forward path', () => {
    assert.strictEqual(canTransition('prospect', 'onboarding'), true);
    assert.strictEqual(canTransition('onboarding', 'qualified'), true);
    assert.strictEqual(canTransition('qualified', 'active'), true);
    assert.strictEqual(canTransition('active', 'offboarded'), true);
});

test('canTransition allows suspend/reactivate cycle', () => {
    assert.strictEqual(canTransition('active', 'suspended'), true);
    assert.strictEqual(canTransition('suspended', 'active'), true);
});

test('canTransition allows blacklisting from any non-terminal stage', () => {
    for (const from of ['prospect', 'onboarding', 'qualified', 'active', 'suspended']) {
        assert.strictEqual(canTransition(from, 'blacklisted'), true, `expected ${from} → blacklisted`);
    }
});

test('canTransition rejects illegal skips', () => {
    assert.strictEqual(canTransition('prospect', 'active'), false);
    assert.strictEqual(canTransition('onboarding', 'active'), false);
    assert.strictEqual(canTransition('qualified', 'offboarded'), false);
});

test('terminal stages have no outbound transitions', () => {
    assert.deepStrictEqual(STAGE_FLOW.offboarded, []);
    assert.deepStrictEqual(STAGE_FLOW.blacklisted, []);
    assert.strictEqual(canTransition('offboarded', 'active'), false);
    assert.strictEqual(canTransition('blacklisted', 'active'), false);
});

test('canTransition is safe for unknown source stages', () => {
    assert.strictEqual(canTransition('does-not-exist', 'active'), false);
    assert.strictEqual(canTransition(undefined, 'active'), false);
});
