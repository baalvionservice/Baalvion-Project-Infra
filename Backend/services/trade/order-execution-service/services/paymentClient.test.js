'use strict';
const { initiate } = require('./paymentClient');

describe('paymentClient rail routing', () => {
    test('routes to the RazorpayX adapter when provider=razorpayx and maps the intent', async () => {
        const psp = {
            initiate: jest.fn(async (r) => ({ id: 'pout_1', idempotencyKey: r.idempotencyKey, status: 'PENDING', amount: r.amount, currency: r.currency, rail: 'razorpayx' })),
        };
        const out = await initiate(
            { idempotencyKey: 'order-abc', sourceAccountId: 'va_1', destinationAccountId: 'fa_1', amount: 1917.5, currency: 'INR', tenantId: 't1' },
            { provider: 'razorpayx', psp },
        );
        expect(psp.initiate).toHaveBeenCalledWith(expect.objectContaining({
            idempotencyKey: 'order-abc', sourceAccountId: 'va_1', destinationAccountId: 'fa_1',
            amount: 1917.5, currency: 'INR', paymentScheme: 'IMPS',
        }));
        expect(out.id).toBe('pout_1');
        expect(out.status).toBe('PENDING');
    });

    test('a RazorpayX timeout propagates (UNKNOWN, never a fake success)', async () => {
        const psp = {
            initiate: jest.fn(async () => { const e = new Error('timeout'); e.name = 'IntegrationTimeoutError'; throw e; }),
        };
        await expect(initiate({ idempotencyKey: 'order-x', currency: 'INR' }, { provider: 'razorpayx', psp }))
            .rejects.toThrow('timeout');
    });

    test('DEFAULT internal path POSTs the mapped body to /api/v1/payments/initiate', async () => {
        const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({ id: 'pay_1', status: 'PENDING' }),
        });
        try {
            const out = await initiate(
                {
                    idempotencyKey: 'order-abc', sourceAccountId: 'acc_src', destinationAccountId: 'acc_dst',
                    amount: 1917.5, currency: 'INR',
                },
                { provider: 'internal', url: 'http://payments.test' },
            );
            expect(fetchSpy).toHaveBeenCalledTimes(1);
            const [calledUrl, calledInit] = fetchSpy.mock.calls[0];
            expect(calledUrl).toBe('http://payments.test/api/v1/payments/initiate');
            expect(calledInit.method).toBe('POST');
            expect(JSON.parse(calledInit.body)).toEqual({
                idempotencyKey: 'order-abc', sourceAccountId: 'acc_src', destinationAccountId: 'acc_dst',
                amount: 1917.5, currency: 'INR', paymentScheme: 'INTERNAL',
            });
            expect(out).toEqual({ id: 'pay_1', status: 'PENDING' });
        } finally {
            fetchSpy.mockRestore();
        }
    });
});
