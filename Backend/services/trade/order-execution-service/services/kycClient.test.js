'use strict';
const { getStatus } = require('./kycClient');

describe('kycClient.getStatus', () => {
    test('delegates to the KYC adapter getResult and returns its result', async () => {
        const adapter = { getResult: jest.fn(async () => ({ id: 'wr_1', status: 'APPROVED' })) };
        const out = await getStatus({ kycId: 'wr_1', tenantId: 't1' }, { adapter });
        expect(adapter.getResult).toHaveBeenCalledWith('wr_1', { tenantId: 't1' });
        expect(out.status).toBe('APPROVED');
    });

    test('an unreachable provider THROWS (fail-closed — the gate then blocks)', async () => {
        const adapter = { getResult: jest.fn(async () => { throw new Error('onfido unreachable'); }) };
        await expect(getStatus({ kycId: 'wr_1' }, { adapter })).rejects.toThrow('onfido unreachable');
    });
});
