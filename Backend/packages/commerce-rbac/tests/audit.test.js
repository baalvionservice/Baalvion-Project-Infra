'use strict';
// Validation tests for reliable commerce-PEP audit emission.
// Run: node --test tests/audit.test.js   (from packages/commerce-rbac)
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { createAuditEmitter, deliverToStream, STREAM_KEY } = require('../src/audit');

const noSleep = () => Promise.resolve();

function fakeLogger() {
    const lines = { warn: [], error: [], info: [] };
    return {
        lines,
        warn: (m) => lines.warn.push(m),
        error: (m) => lines.error.push(m),
        info: (m) => lines.info.push(m),
    };
}

// A redis whose xadd fails the first `failTimes` calls, then succeeds.
function flakyRedis(failTimes) {
    let calls = 0;
    return {
        get calls() { return calls; },
        async xadd() {
            calls++;
            if (calls <= failTimes) throw new Error('redis down #' + calls);
            return '1-0';
        },
    };
}

const evt = { service: 'order-service', type: 'commerce.access_denied', decision: 'deny', userId: '7' };

test('deliverToStream succeeds on the first attempt', async () => {
    const redis = flakyRedis(0);
    const logger = fakeLogger();
    const ok = await deliverToStream({ redis, event: evt, logger, sleep: noSleep });
    assert.equal(ok, true);
    assert.equal(redis.calls, 1);
    assert.equal(logger.lines.error.length, 0);
});

test('deliverToStream retries a transient failure then succeeds (no loud log)', async () => {
    const redis = flakyRedis(2); // fail twice, succeed on the 3rd
    const logger = fakeLogger();
    const ok = await deliverToStream({ redis, event: evt, logger, maxAttempts: 3, sleep: noSleep });
    assert.equal(ok, true);
    assert.equal(redis.calls, 3);
    assert.equal(logger.lines.error.length, 0, 'no failure log when delivery eventually succeeds');
});

test('deliverToStream that exhausts retries logs a loud, recoverable failure (not silent)', async () => {
    const redis = flakyRedis(99); // always fails
    const logger = fakeLogger();
    const ok = await deliverToStream({ redis, event: evt, logger, maxAttempts: 3, sleep: noSleep });
    assert.equal(ok, false);
    assert.equal(redis.calls, 3);
    assert.equal(logger.lines.error.length, 1, 'final failure must be logged loudly');
    const logged = JSON.parse(logger.lines.error[0]);
    assert.equal(logged.auditDeliveryFailed, true);
    assert.equal(logged.attempts, 3);
    // The FULL event rides on the failure line, so the audit record is still recoverable from logs.
    assert.equal(logged.type, 'commerce.access_denied');
    assert.equal(logged.userId, '7');
    assert.equal(logged.service, 'order-service');
});

test('deliverToStream xadd targets the shared baalvion:events stream', async () => {
    const seen = [];
    const redis = { async xadd(...args) { seen.push(args); return '1-0'; } };
    await deliverToStream({ redis, event: evt, logger: fakeLogger(), sleep: noSleep });
    assert.equal(seen[0][0], STREAM_KEY);
    assert.equal(seen[0][2], 'type');
    assert.equal(seen[0][3], 'commerce.access_denied');
});

test('emit always writes the guaranteed stdout sink and returns the event synchronously', () => {
    const logger = fakeLogger();
    const audit = createAuditEmitter({ service: 'order-service', redis: null, logger });
    const out = audit.accessDenied({ userId: 42, role: 'viewer', action: 'order.refund', reason: 'insufficient' });

    assert.equal(out.type, 'commerce.access_denied');
    assert.equal(out.decision, 'deny');
    assert.equal(out.userId, '42'); // normalized to string
    assert.equal(logger.lines.warn.length, 1);
    const logged = JSON.parse(logger.lines.warn[0]);
    assert.equal(logged.audit, true);
    assert.equal(logged.type, 'commerce.access_denied');
});

test('emit never throws into the request path even when redis xadd rejects', async () => {
    const logger = fakeLogger();
    const redis = flakyRedis(99);
    const audit = createAuditEmitter({ service: 'order-service', redis, logger, streamRetries: 2, sleep: noSleep });
    // Must return synchronously without throwing.
    const out = audit.crossScopeAttempt({ userId: 1, scope: { type: 'store', id: 's1' } });
    assert.equal(out.type, 'commerce.cross_scope_attempt');
    // Let the fire-and-forget delivery settle, then assert the drop was reported loudly (not silent).
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));
    assert.equal(logger.lines.error.length, 1);
    assert.equal(JSON.parse(logger.lines.error[0]).auditDeliveryFailed, true);
});

test('breakglass emits an allow decision', () => {
    const audit = createAuditEmitter({ service: 'order-service', redis: null, logger: fakeLogger() });
    const out = audit.breakglass({ userId: 9, reason: 'rbac_outage' });
    assert.equal(out.type, 'commerce.rbac_breakglass');
    assert.equal(out.decision, 'allow');
});
