'use strict';
/**
 * Unit tests for the outbox redrive worker. The DB layer (claim/mark) is injected
 * via `deps` and `publish` is a fake, so these run with NO live database — matching
 * the pure-function test style already used in services/*.test.js.
 */
const { redriveOnce, backoffMs, MAX_ATTEMPTS } = require('./outboxRedrive');

// Build an injectable in-memory fake of the claim/mark DB layer.
function makeDeps(rows) {
    const calls = { sent: [], retried: [], publishedIds: [] };
    const state = new Map(rows.map((r) => [r.id, { ...r }]));
    const deps = {
        claimRedriveRows: jest.fn(async () => rows.map((r) => ({ ...state.get(r.id) }))),
        markSent: jest.fn(async ({ id }) => {
            const row = state.get(id);
            row.status = 'SENT';
            calls.sent.push(id);
        }),
        markRetryOrFail: jest.fn(async ({ row, now }) => {
            const attempts = (Number(row.attempts) || 0) + 1;
            const failed = attempts >= MAX_ATTEMPTS;
            const s = state.get(row.id);
            s.attempts = attempts;
            s.status = failed ? 'FAILED' : 'PENDING';
            s.available_at = failed ? new Date(now) : new Date(now + backoffMs(attempts));
            calls.retried.push({ id: row.id, attempts, failed, available_at: s.available_at });
            return { attempts, failed };
        }),
    };
    return { deps, calls, state, opts: { deps, now: 1_000_000 } };
}

describe('redriveOnce', () => {
    test('re-publishes a stuck PENDING row and marks it SENT', async () => {
        const { deps, calls, state, opts } = makeDeps([
            { id: 'p1', event_type: 'oms.order.placed.v1', payload: { a: 1 }, tenant_id: 't1', status: 'PENDING', attempts: 0 },
        ]);
        const publish = jest.fn(async () => {});

        const res = await redriveOnce(publish, opts);

        expect(publish).toHaveBeenCalledTimes(1);
        expect(publish).toHaveBeenCalledWith('oms.order.placed.v1', { a: 1, _eventId: 'p1' }, { tenantId: 't1' });
        expect(res).toMatchObject({ claimed: 1, sent: 1, retried: 0, exhausted: 0 });
        expect(state.get('p1').status).toBe('SENT');
        expect(calls.sent).toEqual(['p1']);
        void deps;
    });

    test('a FAILED row under the cap is re-published and marked SENT on success', async () => {
        const { opts, state } = makeDeps([
            { id: 'f1', event_type: 'oms.x.v1', payload: {}, tenant_id: 't1', status: 'FAILED', attempts: 3 },
        ]);
        const publish = jest.fn(async () => {});

        const res = await redriveOnce(publish, opts);

        expect(res).toMatchObject({ claimed: 1, sent: 1 });
        expect(state.get('f1').status).toBe('SENT');
    });

    test('a failing redrive under the cap is retried with bounded backoff (available_at pushed forward)', async () => {
        const now = 1_000_000;
        const { opts, calls, state } = makeDeps([
            { id: 'r1', event_type: 'oms.x.v1', payload: {}, tenant_id: 't1', status: 'PENDING', attempts: 2 },
        ]);
        opts.now = now;
        const publish = jest.fn(async () => { throw new Error('bus down'); });

        const res = await redriveOnce(publish, opts);

        expect(res).toMatchObject({ claimed: 1, sent: 0, retried: 1, exhausted: 0 });
        const r = calls.retried[0];
        expect(r.attempts).toBe(3);
        expect(r.failed).toBe(false);
        // bounded backoff: available_at strictly after `now`, and equals now + backoffMs(3)
        expect(r.available_at.getTime()).toBe(now + backoffMs(3));
        expect(r.available_at.getTime()).toBeGreaterThan(now);
        expect(state.get('r1').status).toBe('PENDING');
    });

    test('past the cap a failing redrive stays FAILED and emits an exhausted alert', async () => {
        const { opts, state } = makeDeps([
            { id: 'e1', event_type: 'oms.x.v1', payload: {}, tenant_id: 't1', status: 'FAILED', attempts: MAX_ATTEMPTS - 1 },
        ]);
        const publish = jest.fn(async () => { throw new Error('still down'); });
        const alert = jest.fn(async () => {});
        opts.alert = alert;

        const res = await redriveOnce(publish, opts);

        expect(res).toMatchObject({ claimed: 1, sent: 0, retried: 0, exhausted: 1 });
        expect(state.get('e1').status).toBe('FAILED');
        expect(alert).toHaveBeenCalledTimes(1);
        expect(alert).toHaveBeenCalledWith(
            'oms.outbox.redrive.exhausted.v1',
            expect.objectContaining({ outboxId: 'e1', attempts: MAX_ATTEMPTS }),
            { tenantId: 't1' },
        );
    });

    test('no double-publish: each claimed row is published exactly once', async () => {
        const { opts } = makeDeps([
            { id: 'a', event_type: 'oms.x.v1', payload: {}, tenant_id: 't1', status: 'PENDING', attempts: 0 },
            { id: 'b', event_type: 'oms.x.v1', payload: {}, tenant_id: 't1', status: 'FAILED', attempts: 1 },
        ]);
        const seen = [];
        const publish = jest.fn(async (_t, payload) => { seen.push(payload._eventId); });

        const res = await redriveOnce(publish, opts);

        expect(res.sent).toBe(2);
        expect(seen.sort()).toEqual(['a', 'b']);
        expect(new Set(seen).size).toBe(seen.length); // no id appears twice
    });

    test('claim returning no rows is a clean no-op', async () => {
        const { opts } = makeDeps([]);
        const publish = jest.fn(async () => {});
        const res = await redriveOnce(publish, opts);
        expect(res).toEqual({ claimed: 0, sent: 0, retried: 0, exhausted: 0 });
        expect(publish).not.toHaveBeenCalled();
    });

    test('rejects a non-function publish', async () => {
        await expect(redriveOnce(null, {})).rejects.toThrow(/publish/);
    });
});

describe('backoffMs', () => {
    test('is bounded and grows with attempts', () => {
        expect(backoffMs(1)).toBe(2000);
        expect(backoffMs(3)).toBe(8000);
        // capped at 2^8 seconds regardless of how high attempts climbs
        expect(backoffMs(99)).toBe(1000 * 2 ** 8);
        expect(backoffMs(8)).toBe(backoffMs(99));
    });
});
