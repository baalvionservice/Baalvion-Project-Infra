'use strict';
// Unit tests for the tenant-bound KYC registry. No live DB/network — the models and the
// tenancy ALS are mocked, and the provider adapter is injected via deps.

// runWithTenant just runs the callback (passthrough) — context is exercised in live tests.
jest.mock('@baalvion/tenancy', () => ({
    runWithTenant: (_ctx, fn) => fn(),
}));

// Mock the model layer. sequelize.transaction is a passthrough that hands a fake tx through.
// Vars referenced inside jest.mock() factories MUST be `mock`-prefixed (jest hoisting rule).
const mockFindOne = jest.fn();
const mockUpsert = jest.fn();
const mockTransaction = jest.fn((fn) => fn({ FAKE_TX: true }));

jest.mock('../models', () => ({
    sequelize: { transaction: (fn) => mockTransaction(fn) },
    KycVerification: { findOne: (...a) => mockFindOne(...a), upsert: (...a) => mockUpsert(...a) },
}));

const kycRegistry = require('./kycRegistry');
const findOne = mockFindOne;
const upsert = mockUpsert;
const transaction = mockTransaction;

beforeEach(() => {
    findOne.mockReset();
    upsert.mockReset();
    transaction.mockClear();
});

describe('requireApproved (the gate primitive)', () => {
    test('an APPROVED tenant-scoped row -> { approved:true, status:APPROVED }', async () => {
        findOne.mockResolvedValueOnce({ status: 'APPROVED' });
        const out = await kycRegistry.requireApproved({ tenantId: 't1', subjectRef: 'org-9' });
        expect(out).toEqual({ approved: true, status: 'APPROVED' });
    });

    test('no row -> { approved:false, status:NOT_FOUND }', async () => {
        findOne.mockResolvedValueOnce(null);
        const out = await kycRegistry.requireApproved({ tenantId: 't1', subjectRef: 'org-9' });
        expect(out).toEqual({ approved: false, status: 'NOT_FOUND' });
    });

    test('a non-APPROVED row -> approved:false with its status', async () => {
        findOne.mockResolvedValueOnce({ status: 'REVIEW' });
        const out = await kycRegistry.requireApproved({ tenantId: 't1', subjectRef: 'org-9' });
        expect(out).toEqual({ approved: false, status: 'REVIEW' });
    });

    // CRITICAL: prove the lookup is TENANT-BOUND — it filters by the ORDER's tenant_id, never global.
    test('SECURITY: findOne is filtered by tenant_id AND subject_ref (never by a provider id)', async () => {
        findOne.mockResolvedValueOnce({ status: 'APPROVED' });
        await kycRegistry.requireApproved({ tenantId: 'tenant-A', subjectRef: 'org-9' });
        expect(findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: { tenant_id: 'tenant-A', subject_ref: 'org-9' },
        }));
        // The where clause must NOT contain a provider id key — the gate never resolves by Onfido id.
        const arg = findOne.mock.calls[0][0];
        expect(arg.where).not.toHaveProperty('provider_verification_id');
        expect(arg.where).not.toHaveProperty('id');
    });

    test('rejects when tenantId is missing (no global scan)', async () => {
        await expect(kycRegistry.requireApproved({ subjectRef: 'org-9' })).rejects.toThrow('tenantId required');
        expect(findOne).not.toHaveBeenCalled();
    });
});

describe('startVerification', () => {
    test('calls adapter.startVerification + upserts the server-stored provider id', async () => {
        // 1st findOne: no existing row. 2nd findOne: the freshly-upserted row returned.
        findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ subject_ref: 'org-9', status: 'PENDING', provider_verification_id: 'wr_1' });
        upsert.mockResolvedValueOnce([{}, true]);
        const adapter = {
            name: 'onfido',
            startVerification: jest.fn(async () => ({ id: 'wr_1', status: 'PENDING' })),
        };

        const row = await kycRegistry.startVerification(
            { tenantId: 't1', subjectRef: 'org-9', subjectType: 'BUSINESS', legalName: 'Acme Ltd', country: 'GB' },
            { adapter },
        );

        expect(adapter.startVerification).toHaveBeenCalledWith(expect.objectContaining({
            type: 'BUSINESS', legalName: 'Acme Ltd', country: 'GB', externalRef: 'org-9', tenantId: 't1',
        }));
        expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
            tenant_id: 't1', subject_ref: 'org-9', provider_verification_id: 'wr_1', status: 'PENDING',
        }), expect.any(Object));
        expect(row.provider_verification_id).toBe('wr_1');
    });

    test('an already-APPROVED row short-circuits (no second adapter call, no upsert)', async () => {
        findOne.mockResolvedValueOnce({ subject_ref: 'org-9', status: 'APPROVED', provider_verification_id: 'wr_0' });
        const adapter = { name: 'onfido', startVerification: jest.fn() };

        const row = await kycRegistry.startVerification({ tenantId: 't1', subjectRef: 'org-9' }, { adapter });

        expect(adapter.startVerification).not.toHaveBeenCalled();
        expect(upsert).not.toHaveBeenCalled();
        expect(row.status).toBe('APPROVED');
    });

    // Fix #3: a PENDING re-entry that ALREADY holds a provider id must NOT re-submit to the provider.
    test('a row that already has a provider_verification_id short-circuits even when PENDING', async () => {
        findOne.mockResolvedValueOnce({ subject_ref: 'org-9', status: 'PENDING', provider_verification_id: 'wr_7' });
        const adapter = { name: 'onfido', startVerification: jest.fn() };

        const row = await kycRegistry.startVerification({ tenantId: 't1', subjectRef: 'org-9' }, { adapter });

        expect(adapter.startVerification).not.toHaveBeenCalled();
        expect(upsert).not.toHaveBeenCalled();
        expect(row.provider_verification_id).toBe('wr_7');
    });

    // A row that never got a provider id (prior call threw before the adapter returned) DOES retry.
    test('a row with no provider id retries the adapter', async () => {
        findOne
            .mockResolvedValueOnce({ subject_ref: 'org-9', status: 'NOT_STARTED', provider_verification_id: null })
            .mockResolvedValueOnce({ subject_ref: 'org-9', status: 'PENDING', provider_verification_id: 'wr_9' });
        upsert.mockResolvedValueOnce([{}, true]);
        const adapter = { name: 'onfido', startVerification: jest.fn(async () => ({ id: 'wr_9', status: 'PENDING' })) };

        await kycRegistry.startVerification({ tenantId: 't1', subjectRef: 'org-9' }, { adapter });

        expect(adapter.startVerification).toHaveBeenCalledTimes(1);
        expect(upsert).toHaveBeenCalled();
    });
});

describe('applyWebhookUpdate', () => {
    test('finds the row by the server-stored provider id (under bypass) and updates its status', async () => {
        const update = jest.fn(async () => {});
        findOne.mockResolvedValueOnce({
            tenant_id: 't1', subject_ref: 'org-9', provider_verification_id: 'wr_1', status: 'PENDING', update,
        });

        const out = await kycRegistry.applyWebhookUpdate({
            providerVerificationId: 'wr_1', status: 'APPROVED', reasons: ['clear'],
        });

        expect(findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: { provider_verification_id: 'wr_1' },
        }));
        expect(update).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'APPROVED', reasons: ['clear'] }),
            expect.any(Object),
        );
        expect(out).toEqual({ updated: true, tenantId: 't1', subjectRef: 'org-9' });
    });

    test('returns { updated:false } when no row matches the provider id', async () => {
        findOne.mockResolvedValueOnce(null);
        const out = await kycRegistry.applyWebhookUpdate({ providerVerificationId: 'nope', status: 'APPROVED' });
        expect(out).toEqual({ updated: false });
    });

    // Fix #2: an out-of-enum status is rejected at the write boundary — no row read, no write.
    test('rejects an out-of-enum status with no write (does not rely on the DB CHECK)', async () => {
        const out = await kycRegistry.applyWebhookUpdate({ providerVerificationId: 'wr_1', status: 'CLEARED' });
        expect(out).toEqual({ updated: false });
        expect(findOne).not.toHaveBeenCalled();
    });

    // Fix #4: a terminal APPROVED row is never regressed to a non-terminal status (replay / out-of-order).
    test('does NOT regress a terminal APPROVED row to a non-terminal status', async () => {
        const update = jest.fn(async () => {});
        findOne.mockResolvedValueOnce({
            tenant_id: 't1', subject_ref: 'org-9', provider_verification_id: 'wr_1', status: 'APPROVED', update,
        });

        const out = await kycRegistry.applyWebhookUpdate({ providerVerificationId: 'wr_1', status: 'PENDING' });

        expect(update).not.toHaveBeenCalled();
        expect(out).toEqual({ updated: false, tenantId: 't1', subjectRef: 'org-9' });
    });

    // Terminal -> terminal still proceeds (APPROVED -> REJECTED is a legitimate later decision).
    test('a terminal -> terminal update still proceeds', async () => {
        const update = jest.fn(async () => {});
        findOne.mockResolvedValueOnce({
            tenant_id: 't1', subject_ref: 'org-9', provider_verification_id: 'wr_1', status: 'APPROVED', update,
        });

        const out = await kycRegistry.applyWebhookUpdate({ providerVerificationId: 'wr_1', status: 'REJECTED' });

        expect(update).toHaveBeenCalled();
        expect(out).toEqual({ updated: true, tenantId: 't1', subjectRef: 'org-9' });
    });

    // Fix #8: non-array reasons are coerced to null before storing.
    test('coerces a non-array reasons value to null', async () => {
        const update = jest.fn(async () => {});
        findOne.mockResolvedValueOnce({
            tenant_id: 't1', subject_ref: 'org-9', provider_verification_id: 'wr_1', status: 'PENDING', update,
        });

        await kycRegistry.applyWebhookUpdate({ providerVerificationId: 'wr_1', status: 'REVIEW', reasons: 'oops' });

        expect(update).toHaveBeenCalledWith(
            expect.objectContaining({ reasons: null }),
            expect.any(Object),
        );
    });
});
