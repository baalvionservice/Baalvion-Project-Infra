'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Stub the two collaborators before the module under test resolves them, so this stays a unit
// test: no database, no Redis, and no chance of deleting anything on the machine it runs on.
const recordsPath = require.resolve('./paymentRecordsService');
const modelsPath = require.resolve('../models');

const stubs = { pruneCalls: [], eligible: 0, locked: true, tableSize: '1 MB' };

require.cache[recordsPath] = {
    id: recordsPath, filename: recordsPath, loaded: true, exports: {
        async retentionReport({ olderThanDays }) {
            return { total: stubs.eligible, olderThanDays, eligibleForArchive: stubs.eligible, oldest: null, tableSize: stubs.tableSize };
        },
        async pruneOlderThan({ olderThanDays, confirm, limit }) {
            stubs.pruneCalls.push({ olderThanDays, confirm, limit });
            const pruned = Math.min(limit, stubs.eligible);
            stubs.eligible -= pruned;
            return { pruned, olderThanDays };
        },
    },
};
require.cache[modelsPath] = {
    id: modelsPath, filename: modelsPath, loaded: true, exports: {
        sequelize: {
            async query(sql) {
                if (sql.includes('pg_try_advisory_lock')) return [[{ locked: stubs.locked }]];
                return [[{}]];
            },
        },
    },
};

const retention = require('./paymentRecordsRetention');

function reset({ eligible = 0, locked = true } = {}) {
    stubs.pruneCalls = [];
    stubs.eligible = eligible;
    stubs.locked = locked;
}

test('retention is off unless a window is configured', () => {
    assert.equal(retention.config({}).enabled, false);
    assert.equal(retention.config({ PAYMENT_RECORDS_RETENTION_DAYS: '' }).enabled, false);
});

test('a window under the floor refuses rather than deleting recent history', () => {
    // The failure this prevents: `30` typed where `730` was meant silently deletes two years
    // of financial records on the next tick.
    for (const bad of ['30', '0', '-730', '364', 'soon', '730.5']) {
        const c = retention.config({ PAYMENT_RECORDS_RETENTION_DAYS: bad });
        assert.equal(c.enabled, false, `expected "${bad}" to be refused`);
        assert.match(c.error, /must be a whole number of days/);
    }
    assert.equal(retention.config({ PAYMENT_RECORDS_RETENTION_DAYS: '365' }).enabled, true);
});

test('bounds are applied to the tunables, not trusted', () => {
    const c = retention.config({
        PAYMENT_RECORDS_RETENTION_DAYS: '730',
        PAYMENT_RECORDS_RETENTION_INTERVAL_HOURS: '0',
        PAYMENT_RECORDS_RETENTION_BATCH: '99999999',
        PAYMENT_RECORDS_RETENTION_MAX_BATCHES: 'lots',
    });
    assert.equal(c.intervalMs, 24 * 3600 * 1000); // out-of-range falls back to the default
    assert.equal(c.batch, 5000);
    assert.equal(c.maxBatches, 20);
});

test('a sweep deletes in batches and stops when a batch comes back short', async () => {
    reset({ eligible: 12000 });
    const res = await retention.sweepOnce({ enabled: true, days: 730, batch: 5000, maxBatches: 20, intervalMs: 1 });
    assert.equal(res.swept, true);
    assert.equal(res.pruned, 12000);
    assert.equal(res.batches, 2); // 5000, 5000, then 2000 short-circuits the loop
    assert.equal(stubs.pruneCalls.length, 3);
    // Every delete is explicit — the guard in pruneOlderThan is never bypassed.
    assert.ok(stubs.pruneCalls.every((c) => c.confirm === true));
});

test('one tick cannot become an unbounded delete', async () => {
    // A first run against years of history must not hold one enormous transaction.
    reset({ eligible: 1_000_000 });
    const res = await retention.sweepOnce({ enabled: true, days: 730, batch: 1000, maxBatches: 3, intervalMs: 1 });
    assert.equal(res.pruned, 3000);
    assert.equal(res.batches, 3);
    assert.equal(res.remaining, 997000);
});

test('a second instance holding the lock does not sweep too', async () => {
    reset({ eligible: 500, locked: false });
    const res = await retention.sweepOnce({ enabled: true, days: 730, batch: 100, maxBatches: 5, intervalMs: 1 });
    assert.equal(res.swept, false);
    assert.equal(res.reason, 'lock_held_elsewhere');
    assert.equal(stubs.pruneCalls.length, 0);
});

test('an unconfigured sweep does nothing at all', async () => {
    reset({ eligible: 999 });
    const res = await retention.sweepOnce({ enabled: false });
    assert.equal(res.swept, false);
    assert.equal(stubs.pruneCalls.length, 0);
});

test('starting without configuration is a no-op, not a crash', () => {
    assert.equal(retention.startRetentionSweep({}).started, false);
    assert.equal(retention.startRetentionSweep({ PAYMENT_RECORDS_RETENTION_DAYS: '10' }).started, false);
    retention.stopRetentionSweep();
});
