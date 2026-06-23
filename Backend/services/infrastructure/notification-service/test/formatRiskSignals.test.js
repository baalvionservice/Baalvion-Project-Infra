'use strict';
/**
 * Pure-logic unit tests for the eventConsumer risk-signal formatter.
 *
 * Uses the built-in node:test runner + node:assert — NO new dependency, NO live
 * Redis/DB/network. `formatRiskSignals` maps high-risk-session signal codes to the
 * human-readable strings embedded in the security-alert email; getting that mapping
 * wrong silently degrades a security notification, so it is worth pinning down.
 *
 * appConfig calls requireEnv('INTERNAL_SERVICE_SECRET') at require time, so we set a
 * throwaway value here BEFORE importing the worker module (the worker only pulls in
 * config/queues lazily — no connection is opened by requiring it).
 */
process.env.INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'test-secret';

const test = require('node:test');
const assert = require('node:assert');

const { formatRiskSignals } = require('../workers/eventConsumer');

test('returns empty string for no signals (default arg)', () => {
    assert.strictEqual(formatRiskSignals(), '');
});

test('returns empty string for an empty signal array', () => {
    assert.strictEqual(formatRiskSignals([]), '');
});

test('maps a known signal type to its human-readable description', () => {
    const out = formatRiskSignals([{ type: 'impossible_travel' }]);
    assert.match(out, /physically impossible/);
});

test('joins multiple known signals with a semicolon separator', () => {
    const out = formatRiskSignals([{ type: 'new_country' }, { type: 'tor_exit' }]);
    assert.match(out, /new country/);
    assert.match(out, /anonymous network/);
    assert.strictEqual(out.split('; ').length, 2);
});

test('falls back to the raw signal type when it is unknown', () => {
    assert.strictEqual(formatRiskSignals([{ type: 'some_future_signal' }]), 'some_future_signal');
});

test('handles a mix of known and unknown signal types', () => {
    const out = formatRiskSignals([{ type: 'new_device' }, { type: 'mystery' }]);
    assert.match(out, /unrecognised device/);
    assert.match(out, /mystery/);
});
