'use strict';
/**
 * War Room 3 — unit tests for ledger write authorization.
 * Pure-logic (no DB): trusted internal services and finance/admin roles may write;
 * viewers/members and any low-privilege role are rejected.
 */
const { requireLedgerWriter } = require('../middleware/financialGuards');

function run(user) {
    const req = { user };
    let statusCode = null;
    let body = null;
    let nextCalled = false;
    const res = {
        status(code) { statusCode = code; return this; },
        json(payload) { body = payload; return this; },
    };
    const next = () => { nextCalled = true; };
    requireLedgerWriter(req, res, next);
    return { statusCode, body, nextCalled };
}

describe('requireLedgerWriter', () => {
    test('trusted internal service (X-Internal-Key) may post', () => {
        const r = run({ isService: true, roles: ['SERVICE'] });
        expect(r.nextCalled).toBe(true);
        expect(r.statusCode).toBeNull();
    });

    test('finance/admin human roles may write', () => {
        for (const role of ['admin', 'owner', 'super_admin', 'finance_officer', 'compliance_officer']) {
            const r = run({ isService: false, roles: [role] });
            expect(r.nextCalled).toBe(true);
        }
    });

    test('role match is case-insensitive', () => {
        const r = run({ roles: ['ADMIN'] });
        expect(r.nextCalled).toBe(true);
    });

    test('viewer / member / client are rejected 403', () => {
        for (const role of ['viewer', 'member', 'client', 'editor', 'support']) {
            const r = run({ isService: false, roles: [role] });
            expect(r.nextCalled).toBe(false);
            expect(r.statusCode).toBe(403);
            expect(r.body.error).toBe('FORBIDDEN');
        }
    });

    test('no roles → rejected 403', () => {
        const r = run({ roles: [] });
        expect(r.nextCalled).toBe(false);
        expect(r.statusCode).toBe(403);
    });
});
