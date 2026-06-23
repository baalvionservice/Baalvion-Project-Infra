'use strict';
/**
 * Pure unit tests for the audit hash-chain (tamper-evidence core).
 *
 * Runs with NO database and NO network — hashChain.js is pure. These tests pin
 * the two properties the whole append-only guarantee rests on:
 *   1. determinism: the same logical event always produces the same hash, and
 *      jsonb metadata key reordering must NOT change it (stable stringify).
 *   2. tamper-evidence: changing any chained field, or the prev hash, changes
 *      the computed hash.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const { GENESIS, stableStringify, canonical, sha256hex, computeHash } = require('./hashChain');

const baseEvent = () => ({
    occurred_at: '2026-06-23T10:00:00.000Z',
    actor_id: 'user-1',
    actor_org_id: 'org-1',
    ip_address: '10.0.0.1',
    user_agent: 'jest',
    action: 'login',
    resource_type: 'session',
    resource_id: 'sess-1',
    tenant_id: 'tenant-1',
    scope_id: 'scope-1',
    outcome: 'success',
    severity: 'info',
    source_service: 'auth-service',
    app_id: 'app-1',
    correlation_id: 'corr-1',
    metadata: { b: 2, a: 1 },
});

describe('GENESIS', () => {
    it('is 64 zero hex chars (sha256 width)', () => {
        assert.strictEqual(GENESIS, '0'.repeat(64));
        assert.match(GENESIS, /^[0]{64}$/);
    });
});

describe('stableStringify', () => {
    it('sorts object keys so reordering is canonical', () => {
        assert.strictEqual(stableStringify({ b: 2, a: 1 }), stableStringify({ a: 1, b: 2 }));
    });

    it('sorts keys recursively in nested objects', () => {
        assert.strictEqual(
            stableStringify({ x: { d: 4, c: 3 } }),
            stableStringify({ x: { c: 3, d: 4 } }),
        );
    });

    it('preserves array order (arrays are ordered, not sorted)', () => {
        assert.notStrictEqual(stableStringify([1, 2]), stableStringify([2, 1]));
    });

    it('handles null and primitives', () => {
        assert.strictEqual(stableStringify(null), 'null');
        assert.strictEqual(stableStringify('s'), '"s"');
        assert.strictEqual(stableStringify(7), '7');
    });
});

describe('canonical', () => {
    it('is deterministic for the same event', () => {
        assert.strictEqual(canonical(baseEvent()), canonical(baseEvent()));
    });

    it('is invariant to metadata key ordering', () => {
        const a = baseEvent();
        const b = { ...baseEvent(), metadata: { a: 1, b: 2 } };
        assert.strictEqual(canonical(a), canonical(b));
    });

    it('normalizes occurred_at to ISO and tolerates missing optional fields', () => {
        const e = { occurred_at: '2026-06-23T10:00:00Z', action: 'x' };
        assert.doesNotThrow(() => canonical(e));
        assert.ok(canonical(e).startsWith('2026-06-23T10:00:00.000Z|'));
    });
});

describe('computeHash (chaining + tamper-evidence)', () => {
    it('produces a 64-char hex sha256', () => {
        const h = computeHash(GENESIS, baseEvent());
        assert.match(h, /^[0-9a-f]{64}$/);
    });

    it('chains: same prev + same event => same hash', () => {
        assert.strictEqual(computeHash(GENESIS, baseEvent()), computeHash(GENESIS, baseEvent()));
    });

    it('changing a chained field changes the hash', () => {
        const h1 = computeHash(GENESIS, baseEvent());
        const tampered = { ...baseEvent(), outcome: 'failure' };
        assert.notStrictEqual(h1, computeHash(GENESIS, tampered));
    });

    it('changing the prev hash changes the hash (links the chain)', () => {
        const h1 = computeHash(GENESIS, baseEvent());
        const h2 = computeHash(sha256hex('different-prev'), baseEvent());
        assert.notStrictEqual(h1, h2);
    });

    it('reordering metadata keys does NOT change the hash', () => {
        const a = computeHash(GENESIS, baseEvent());
        const b = computeHash(GENESIS, { ...baseEvent(), metadata: { a: 1, b: 2 } });
        assert.strictEqual(a, b);
    });
});
