'use strict';
const { postEntry, isUuid } = require('./ledgerClient');

const DEBIT = '11111111-1111-1111-1111-111111111111';
const CREDIT = '22222222-2222-2222-2222-222222222222';
const TENANT = '33333333-3333-3333-3333-333333333333';

describe('ledgerClient.postEntry', () => {
    test('POSTs a double-entry to /api/v1/ledger/entries with X-Tenant-ID + normalized body', async () => {
        const fetchImpl = jest.fn(async () => ({ ok: true, json: async () => ({ id: 'e1', status: 'POSTED' }) }));
        const out = await postEntry({
            tenantId: TENANT, transactionRef: 'oms-settle-abc', debitAccountId: DEBIT, creditAccountId: CREDIT,
            amount: 2231.97, currency: 'inr', entryType: 'SETTLEMENT', description: 'settle',
        }, { url: 'http://ledger.test', fetchImpl });

        expect(out.id).toBe('e1');
        const [url, init] = fetchImpl.mock.calls[0];
        expect(url).toBe('http://ledger.test/api/v1/ledger/entries');
        expect(init.method).toBe('POST');
        expect(init.headers['X-Tenant-ID']).toBe(TENANT);
        expect(JSON.parse(init.body)).toMatchObject({
            transactionRef: 'oms-settle-abc', debitAccountId: DEBIT, creditAccountId: CREDIT,
            amount: 2231.97, currency: 'INR', entryType: 'SETTLEMENT',
        });
    });

    test('rejects non-UUID account ids before any network call', async () => {
        const fetchImpl = jest.fn();
        await expect(postEntry({ debitAccountId: 'not-a-uuid', creditAccountId: CREDIT, amount: 1, currency: 'INR' }, { fetchImpl }))
            .rejects.toMatchObject({ code: 'LEDGER_BAD_ACCOUNTS' });
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    test('rejects an amount below 0.01', async () => {
        const fetchImpl = jest.fn();
        await expect(postEntry({ debitAccountId: DEBIT, creditAccountId: CREDIT, amount: 0, currency: 'INR' }, { fetchImpl }))
            .rejects.toMatchObject({ code: 'LEDGER_BAD_AMOUNT' });
    });

    test('rejects a transactionRef longer than 64 chars before any network call', async () => {
        const fetchImpl = jest.fn();
        const longRef = 'x'.repeat(65);
        await expect(postEntry({
            debitAccountId: DEBIT, creditAccountId: CREDIT, amount: 5, currency: 'INR', transactionRef: longRef,
        }, { fetchImpl }))
            .rejects.toMatchObject({ code: 'LEDGER_BAD_REF' });
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    test('non-2xx surfaces the status (so the consumer can decide retry vs ack)', async () => {
        const fetchImpl = jest.fn(async () => ({ ok: false, status: 400, json: async () => ({ message: 'bad request' }) }));
        await expect(postEntry({ debitAccountId: DEBIT, creditAccountId: CREDIT, amount: 5, currency: 'INR' }, { url: 'http://l', fetchImpl }))
            .rejects.toMatchObject({ status: 400 });
    });

    test('isUuid', () => {
        expect(isUuid(DEBIT)).toBe(true);
        expect(isUuid('nope')).toBe(false);
        expect(isUuid(undefined)).toBe(false);
    });
});
