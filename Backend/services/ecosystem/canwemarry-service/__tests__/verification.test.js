'use strict';
/**
 * Email-verification readiness.
 *
 * The point of these assertions is that the service never claims to know something the
 * platform has not told it. auth-service does not emit an `email_verified` claim, so every
 * account resolves to UNKNOWN — and UNKNOWN must behave as UNKNOWN, not as "probably fine"
 * and not as a silent block.
 */
const { STATE, stateFrom, evaluate, VERIFICATION_REQUIRED, ALWAYS_ALLOWED } = require('../domain/verification');

describe('reading the state from a token', () => {
    test('a token without the claim is UNKNOWN, never VERIFIED', async () => {
        // This is the real shape auth-service issues today: 13 claims, none about email.
        const real = { userId: 'u1', orgId: 'o1', sessionId: 's1', roles: [], permissions: [] };
        expect(stateFrom(real)).toBe(STATE.UNKNOWN);
    });

    test('an anonymous caller is UNKNOWN', () => {
        expect(stateFrom(null)).toBe(STATE.UNKNOWN);
        expect(stateFrom({ userId: null })).toBe(STATE.UNKNOWN);
    });

    test('the claim is honoured under any of the spellings a platform might use', () => {
        expect(stateFrom({ userId: 'u1', emailVerified: true })).toBe(STATE.VERIFIED);
        expect(stateFrom({ userId: 'u1', email_verified: true })).toBe(STATE.VERIFIED);
        expect(stateFrom({ userId: 'u1', evf: true })).toBe(STATE.VERIFIED);
        expect(stateFrom({ userId: 'u1', emailVerified: false })).toBe(STATE.UNVERIFIED);
    });

    test('a truthy-but-not-true claim does not count as verified', () => {
        // A string "false", a 1, or a timestamp must not be read as a yes.
        for (const claim of ['false', 'true', 1, 0, '2026-01-01']) {
            expect(stateFrom({ userId: 'u1', emailVerified: claim })).toBe(STATE.UNKNOWN);
        }
    });
});

describe('what the policy gates', () => {
    test('a verified account may do the gated things', () => {
        for (const action of VERIFICATION_REQUIRED) {
            expect(evaluate(STATE.VERIFIED, action).allowed).toBe(true);
        }
    });

    test('an explicitly unverified account is refused them', () => {
        for (const action of VERIFICATION_REQUIRED) {
            const r = evaluate(STATE.UNVERIFIED, action);
            expect(r.allowed).toBe(false);
            expect(r.reason).toBe('EMAIL_NOT_VERIFIED');
        }
    });

    test('account management and drafting are never gated', () => {
        for (const action of ALWAYS_ALLOWED) {
            expect(evaluate(STATE.UNVERIFIED, action).allowed).toBe(true);
        }
        // A draft is visible to nobody, so it endangers nobody — gating it would only stop
        // someone writing their situation down.
        expect(ALWAYS_ALLOWED).toContain('case:create');
        expect(VERIFICATION_REQUIRED).toContain('case:publish');
    });
});

describe('UNKNOWN is handled honestly', () => {
    test('by default it does not block, and says so', () => {
        const r = evaluate(STATE.UNKNOWN, 'comment:create');
        expect(r.allowed).toBe(true);
        // The reason is explicit rather than silently reading as a pass — enforcement is off
        // because the platform cannot answer, not because the account passed a check.
        expect(r.reason).toBe('VERIFICATION_STATE_UNAVAILABLE_NOT_ENFORCED');
    });

    test('with enforcement switched on it fails CLOSED', () => {
        const r = evaluate(STATE.UNKNOWN, 'comment:create', { enforceOnUnknown: true });
        expect(r.allowed).toBe(false);
        expect(r.reason).toBe('VERIFICATION_STATE_UNAVAILABLE');
    });

    test('enforcement never blocks the ungated actions', () => {
        expect(evaluate(STATE.UNKNOWN, 'case:create', { enforceOnUnknown: true }).allowed).toBe(true);
        expect(evaluate(STATE.UNKNOWN, 'profile:update_self', { enforceOnUnknown: true }).allowed).toBe(true);
    });
});
