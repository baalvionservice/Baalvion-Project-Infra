'use strict';
/**
 * Unit tests for the pure GL-outbox decision helper (shouldWriteLedgerOutbox). Fully mocking
 * the db + tenancy stack to drive cascadeOrderInTx is heavy and brittle, so the decision logic
 * is extracted into a pure function and tested directly (the controller calls it inline).
 */
const { shouldWriteLedgerOutbox } = require('./internalController');

const UUID_A = '11111111-1111-1111-1111-111111111111';
const UUID_B = '22222222-2222-2222-2222-222222222222';
const TENANT = '33333333-3333-3333-3333-333333333333';

describe('internalController.shouldWriteLedgerOutbox', () => {
    test('writes once on a completed settlement with UUID accounts + UUID tenant', () => {
        const d = shouldWriteLedgerOutbox({
            existing: null, debitAccountId: UUID_A, creditAccountId: UUID_B, tenantId: TENANT,
        });
        expect(d.write).toBe(true);
    });

    test('does NOT write when an existing SETTLEMENT_LEDGER_POST row is found (dedup)', () => {
        const d = shouldWriteLedgerOutbox({
            existing: { id: 'prior' }, debitAccountId: UUID_A, creditAccountId: UUID_B, tenantId: TENANT,
        });
        expect(d.write).toBe(false);
        expect(d.reason).toBe('dedup');
    });

    test('does NOT write when an account id is not a UUID', () => {
        const d = shouldWriteLedgerOutbox({
            existing: null, debitAccountId: 'not-a-uuid', creditAccountId: UUID_B, tenantId: TENANT,
        });
        expect(d.write).toBe(false);
        expect(d.reason).toBe('non_uuid_accounts');
    });

    test('does NOT write when the tenant id is not a UUID (ambiguous tenant)', () => {
        const d = shouldWriteLedgerOutbox({
            existing: null, debitAccountId: UUID_A, creditAccountId: UUID_B, tenantId: 'tenant-x',
        });
        expect(d.write).toBe(false);
        expect(d.reason).toBe('non_uuid_tenant');
    });

    test('dedup takes precedence over a non-UUID account (no second intent regardless)', () => {
        const d = shouldWriteLedgerOutbox({
            existing: { id: 'prior' }, debitAccountId: 'bad', creditAccountId: UUID_B, tenantId: TENANT,
        });
        expect(d.write).toBe(false);
        expect(d.reason).toBe('dedup');
    });
});
