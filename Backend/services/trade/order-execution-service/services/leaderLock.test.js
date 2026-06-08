'use strict';
/**
 * Unit tests for the advisory-lock leader guard. The Sequelize connection layer is
 * faked (no live DB): the connection's `query` returns a scripted lock result so we
 * can assert the body runs only when the lock is acquired, and the unlock + release
 * always happen.
 */
const { withAdvisoryLock, ADVISORY_LOCK_KEYS } = require('./leaderLock');

function fakeSequelize({ locked }) {
    const queries = [];
    const released = [];
    const connection = {
        query: jest.fn(async (sql) => {
            queries.push(sql);
            if (/pg_try_advisory_lock/.test(sql)) return { rows: [{ locked }] };
            if (/pg_advisory_unlock/.test(sql)) return { rows: [{ pg_advisory_unlock: true }] };
            return { rows: [] };
        }),
    };
    const sequelize = {
        connectionManager: {
            getConnection: jest.fn(async () => connection),
            releaseConnection: jest.fn(async (c) => { released.push(c); }),
        },
    };
    return { sequelize, connection, queries, released };
}

describe('withAdvisoryLock', () => {
    test('runs the body and reports acquired when the lock is granted', async () => {
        const { sequelize, queries, released, connection } = fakeSequelize({ locked: true });
        const body = jest.fn(async () => 'did-work');

        const res = await withAdvisoryLock(sequelize, ADVISORY_LOCK_KEYS.RECONCILIATION, body);

        expect(body).toHaveBeenCalledTimes(1);
        expect(res).toEqual({ acquired: true, result: 'did-work' });
        // try-lock, then unlock both issued
        expect(queries.some((q) => /pg_try_advisory_lock/.test(q))).toBe(true);
        expect(queries.some((q) => /pg_advisory_unlock/.test(q))).toBe(true);
        expect(released).toEqual([connection]); // connection returned to pool
    });

    test('does NOT run the body and reports not-acquired when the lock is held elsewhere', async () => {
        const { sequelize, queries, released, connection } = fakeSequelize({ locked: false });
        const body = jest.fn(async () => 'should-not-run');

        const res = await withAdvisoryLock(sequelize, ADVISORY_LOCK_KEYS.OUTBOX_REDRIVE, body);

        expect(body).not.toHaveBeenCalled();
        expect(res).toEqual({ acquired: false });
        // no unlock when we never acquired
        expect(queries.some((q) => /pg_advisory_unlock/.test(q))).toBe(false);
        expect(released).toEqual([connection]); // connection still released
    });

    test('releases the connection and unlocks even if the body throws', async () => {
        const { sequelize, queries, released } = fakeSequelize({ locked: true });
        const body = jest.fn(async () => { throw new Error('boom'); });

        await expect(withAdvisoryLock(sequelize, ADVISORY_LOCK_KEYS.RECONCILIATION, body))
            .rejects.toThrow('boom');

        expect(queries.some((q) => /pg_advisory_unlock/.test(q))).toBe(true);
        expect(released.length).toBe(1);
    });

    test('rejects a non-integer lock key', async () => {
        const { sequelize } = fakeSequelize({ locked: true });
        await expect(withAdvisoryLock(sequelize, 'not-a-number', async () => {}))
            .rejects.toThrow(/integer/);
    });

    test('lock keys are distinct fixed bigints', () => {
        expect(ADVISORY_LOCK_KEYS.RECONCILIATION).not.toBe(ADVISORY_LOCK_KEYS.OUTBOX_REDRIVE);
        expect(Number.isInteger(ADVISORY_LOCK_KEYS.RECONCILIATION)).toBe(true);
        expect(Number.isInteger(ADVISORY_LOCK_KEYS.OUTBOX_REDRIVE)).toBe(true);
    });
});
