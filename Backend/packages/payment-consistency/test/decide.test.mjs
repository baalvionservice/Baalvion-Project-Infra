import { test } from 'node:test';
import assert from 'node:assert/strict';

import { decide } from '../dist/index.mjs';

const ev = (type, over = {}) => ({
  type,
  paymentId: over.paymentId ?? 'pay_1',
  provider: over.provider ?? 'stripe',
  transactionId: over.transactionId ?? 'txn_1',
  amount: over.amount ?? 1000,
  currency: over.currency ?? 'INR',
  ...over,
});

// ── Forward transitions on the success ladder ────────────────────────────────────
test('INITIATED + authorize -> AUTHORIZED, emits PAYMENT_AUTHORIZED', () => {
  const d = decide('INITIATED', ev('WEBHOOK_PAYMENT_AUTHORIZED'));
  assert.equal(d.action, 'apply');
  assert.equal(d.to, 'AUTHORIZED');
  assert.deepEqual(d.emit, ['PAYMENT_AUTHORIZED']);
});

test('INITIATED + capture -> CAPTURED (provider skipped authorize)', () => {
  const d = decide('INITIATED', ev('WEBHOOK_PAYMENT_SUCCESS'));
  assert.equal(d.action, 'apply');
  assert.equal(d.to, 'CAPTURED');
  assert.deepEqual(d.emit, ['PAYMENT_CAPTURED']);
});

test('AUTHORIZED + capture -> CAPTURED', () => {
  const d = decide('AUTHORIZED', ev('GATEWAY_CAPTURED'));
  assert.equal(d.action, 'apply');
  assert.equal(d.to, 'CAPTURED');
});

test('CAPTURED + settle -> SETTLED, emits PAYMENT_SETTLED', () => {
  const d = decide('CAPTURED', ev('SETTLEMENT_PROCESSED'));
  assert.equal(d.action, 'apply');
  assert.equal(d.to, 'SETTLED');
  assert.deepEqual(d.emit, ['PAYMENT_SETTLED']);
});

// ── Idempotent / stale / out-of-order are safe no-ops ─────────────────────────────
test('CAPTURED + capture (duplicate) -> noop', () => {
  const d = decide('CAPTURED', ev('WEBHOOK_PAYMENT_SUCCESS'));
  assert.equal(d.action, 'noop');
});

test('CAPTURED + authorize (out-of-order, lower rank) -> noop', () => {
  const d = decide('CAPTURED', ev('WEBHOOK_PAYMENT_AUTHORIZED'));
  assert.equal(d.action, 'noop');
});

test('SETTLED + capture (stale duplicate) -> noop, NOT conflict', () => {
  const d = decide('SETTLED', ev('GATEWAY_CAPTURED'));
  assert.equal(d.action, 'noop');
});

test('SETTLED + settle (duplicate) -> noop', () => {
  const d = decide('SETTLED', ev('GATEWAY_SETTLED'));
  assert.equal(d.action, 'noop');
});

// ── Failure rules ─────────────────────────────────────────────────────────────────
test('INITIATED + fail -> FAILED', () => {
  const d = decide('INITIATED', ev('PAYMENT_FAILED'));
  assert.equal(d.action, 'apply');
  assert.equal(d.to, 'FAILED');
  assert.deepEqual(d.emit, ['PAYMENT_FAILED']);
});

test('AUTHORIZED + fail -> FAILED (no money moved yet)', () => {
  const d = decide('AUTHORIZED', ev('WEBHOOK_PAYMENT_FAILED'));
  assert.equal(d.action, 'apply');
  assert.equal(d.to, 'FAILED');
});

test('FAILED + fail (duplicate) -> noop', () => {
  const d = decide('FAILED', ev('PAYMENT_FAILED'));
  assert.equal(d.action, 'noop');
});

// ── Conflicts: terminal contradictions are surfaced, never auto-flipped ───────────
test('FAILED + capture -> conflict (double-charge signal), emits PAYMENT_CONFLICT', () => {
  const d = decide('FAILED', ev('GATEWAY_CAPTURED'));
  assert.equal(d.action, 'conflict');
  assert.deepEqual(d.emit, ['PAYMENT_CONFLICT']);
});

test('CAPTURED + fail -> conflict (must not wipe a real payment)', () => {
  const d = decide('CAPTURED', ev('PAYMENT_FAILED'));
  assert.equal(d.action, 'conflict');
  assert.deepEqual(d.emit, ['PAYMENT_CONFLICT']);
});

test('SETTLED + fail -> conflict (we moved money, now told it failed)', () => {
  const d = decide('SETTLED', ev('PAYMENT_FAILED'));
  assert.equal(d.action, 'conflict');
});

// ── Determinism: same (state,event) always yields the same decision ───────────────
test('decide is pure/deterministic', () => {
  const a = decide('AUTHORIZED', ev('GATEWAY_CAPTURED'));
  const b = decide('AUTHORIZED', ev('GATEWAY_CAPTURED'));
  assert.deepEqual(a, b);
});
