'use strict';

// Mock the SDK so the permanent-failure ALERT publish is observable + isolated (no real bus).
const mockPublish = jest.fn().mockResolvedValue(undefined);
jest.mock('../platform/sdk', () => ({
    initSdk: jest.fn(),
    getSdk: () => ({ events: { publish: mockPublish }, trace: { runWith: (_c, fn) => fn() } }),
    tryGetSdk: () => ({ events: { publish: mockPublish } }),
}));

const ledgerClient = require('../services/ledgerClient');
const { dispatchLedgerPost } = require('./eventConsumer');
const { OrderEvents } = require('../platform/events');

describe('eventConsumer.dispatchLedgerPost (GL post on external-rail settlement)', () => {
    afterEach(() => { jest.restoreAllMocks(); mockPublish.mockClear(); });

    test('posts the settlement double-entry to the ledger with mapped fields', async () => {
        const spy = jest.spyOn(ledgerClient, 'postEntry').mockResolvedValue({ id: 'e1' });
        await dispatchLedgerPost({
            orderId: 'o1', tenantId: 't1', transactionRef: 'oms-settle-o1',
            debitAccountId: 'd', creditAccountId: 'c', amount: 10.5, currency: 'INR',
        });
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({
            transactionRef: 'oms-settle-o1', debitAccountId: 'd', creditAccountId: 'c', amount: 10.5, currency: 'INR',
        }));
    });

    test('a permanent 4xx is acked (no throw) — avoids a poison-message redelivery loop', async () => {
        jest.spyOn(ledgerClient, 'postEntry').mockRejectedValue(Object.assign(new Error('bad request'), { status: 400 }));
        await expect(dispatchLedgerPost({ orderId: 'o1' })).resolves.toBeUndefined();
    });

    test('a LEDGER_BAD_ACCOUNTS error is acked (permanent)', async () => {
        jest.spyOn(ledgerClient, 'postEntry').mockRejectedValue(Object.assign(new Error('bad accts'), { code: 'LEDGER_BAD_ACCOUNTS' }));
        await expect(dispatchLedgerPost({ orderId: 'o1' })).resolves.toBeUndefined();
    });

    test('a transient 5xx rethrows so XAUTOCLAIM redelivers', async () => {
        jest.spyOn(ledgerClient, 'postEntry').mockRejectedValue(Object.assign(new Error('ledger down'), { status: 503 }));
        await expect(dispatchLedgerPost({ orderId: 'o1' })).rejects.toThrow('ledger down');
    });

    test('a 429 (rate-limit) is TRANSIENT — rethrows for redelivery, not acked', async () => {
        jest.spyOn(ledgerClient, 'postEntry').mockRejectedValue(Object.assign(new Error('rate limited'), { status: 429 }));
        await expect(dispatchLedgerPost({ orderId: 'o1' })).rejects.toThrow('rate limited');
        expect(mockPublish).not.toHaveBeenCalled();
    });

    test('a 408 (proxy timeout) is TRANSIENT — rethrows for redelivery', async () => {
        jest.spyOn(ledgerClient, 'postEntry').mockRejectedValue(Object.assign(new Error('proxy timeout'), { status: 408 }));
        await expect(dispatchLedgerPost({ orderId: 'o1' })).rejects.toThrow('proxy timeout');
        expect(mockPublish).not.toHaveBeenCalled();
    });

    test('a permanent failure ALERTS (best-effort publish) and still acks (no throw)', async () => {
        jest.spyOn(ledgerClient, 'postEntry').mockRejectedValue(Object.assign(new Error('bad request'), { status: 400 }));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        await expect(dispatchLedgerPost({
            orderId: 'o1', tenantId: 't1', transactionRef: 'oms-settle-o1',
        })).resolves.toBeUndefined();
        expect(mockPublish).toHaveBeenCalledWith(
            OrderEvents.SETTLEMENT_LEDGER_POST_FAILED,
            expect.objectContaining({ orderId: 'o1', transactionRef: 'oms-settle-o1', status: 400 }),
            { tenantId: 't1' },
        );
    });

    test('a permanent failure still acks even if the alert publish throws', async () => {
        jest.spyOn(ledgerClient, 'postEntry').mockRejectedValue(Object.assign(new Error('bad request'), { status: 400 }));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        mockPublish.mockRejectedValueOnce(new Error('bus down'));
        await expect(dispatchLedgerPost({ orderId: 'o1' })).resolves.toBeUndefined();
    });
});
