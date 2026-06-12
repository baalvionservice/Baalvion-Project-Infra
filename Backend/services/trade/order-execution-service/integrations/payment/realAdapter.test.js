'use strict';
const { createRealPaymentProvider } = require('./realAdapter');
const { selectProviderKey } = require('./router');
const { PAYMENT_STATUS, PAYMENT_RAIL } = require('./contract');
const { IntegrationTimeoutError } = require('./../_shared/httpClient');
const { IntegrationRequiredError } = require('../IntegrationRequiredError');

const FULL_ENV = {
    RAZORPAYX_KEY_ID: 'rzp_test',
    RAZORPAYX_KEY_SECRET: 'sec',
    RAZORPAYX_ACCOUNT_NUMBER: '2323230000000000',
    RAZORPAY_KEY_ID: 'rzp_test',
    RAZORPAY_KEY_SECRET: 'sec',
    SWIFT_BANK_TRANSPORT: 'host2host',
    SWIFT_DEBTOR_IBAN: 'DE89370400440532013000',
    SWIFT_DEBTOR_BIC: 'COBADEFFXXX',
};
const envFn = (map) => (name) => map[name];

const baseReq = (over = {}) => ({
    idempotencyKey: 'idem-1',
    // no sourceAccountId -> razorpayx falls back to configured account number
    destinationAccountId: 'fa_dst',
    amount: 1917.5,
    currency: 'INR',
    paymentScheme: 'IMPS',
    ...over,
});

describe('router — provider selection', () => {
    const env = envFn({});
    test('INR / UPI / IMPS / NEFT / RTGS -> razorpayx', () => {
        expect(selectProviderKey({ currency: 'INR', paymentScheme: 'IMPS' }, env)).toBe('razorpayx');
        expect(selectProviderKey({ currency: 'INR', paymentScheme: 'UPI' }, env)).toBe('razorpayx');
        expect(selectProviderKey({ currency: 'INR', paymentScheme: 'NEFT' }, env)).toBe('razorpayx');
        expect(selectProviderKey({ currency: 'INR', paymentScheme: 'RTGS' }, env)).toBe('razorpayx');
        expect(selectProviderKey({ currency: 'INR' }, env)).toBe('razorpayx');
    });
    test('card collect -> razorpay', () => {
        expect(selectProviderKey({ currency: 'INR', paymentScheme: 'CARD' }, env)).toBe('razorpay');
    });
    test('SWIFT / SEPA or any non-INR -> swift', () => {
        expect(selectProviderKey({ currency: 'EUR', paymentScheme: 'SWIFT' }, env)).toBe('swift');
        expect(selectProviderKey({ currency: 'EUR', paymentScheme: 'SEPA' }, env)).toBe('swift');
        expect(selectProviderKey({ currency: 'USD' }, env)).toBe('swift');
        expect(selectProviderKey({ currency: 'EUR', paymentScheme: 'IMPS' }, env)).toBe('swift'); // non-INR overrides
    });
    test('PAYMENT_PROVIDER_ROUTING JSON override is honored for INR schemes', () => {
        const ovEnv = envFn({ PAYMENT_PROVIDER_ROUTING: JSON.stringify({ IMPS: 'razorpay' }) });
        expect(selectProviderKey({ currency: 'INR', paymentScheme: 'IMPS' }, ovEnv)).toBe('razorpay');
    });
    test('malformed override JSON is ignored (falls back to defaults)', () => {
        const ovEnv = envFn({ PAYMENT_PROVIDER_ROUTING: '{not json' });
        expect(selectProviderKey({ currency: 'INR', paymentScheme: 'IMPS' }, ovEnv)).toBe('razorpayx');
    });

    test('override targeting an unknown provider key is dropped -> falls back to default (no undefined provider)', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const ovEnv = envFn({ PAYMENT_PROVIDER_ROUTING: JSON.stringify({ CARD: 'nonexistent' }) });
        // CARD would normally route to razorpay; a bogus override must NOT win.
        expect(selectProviderKey({ currency: 'INR', paymentScheme: 'CARD' }, ovEnv)).toBe('razorpay');
        warn.mockRestore();
    });

    test('a bogus override never produces an undefined provider via the live router', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const ovEnv = envFn({ ...FULL_ENV, PAYMENT_PROVIDER_ROUTING: JSON.stringify({ CARD: 'nonexistent' }) });
        const a = createRealPaymentProvider({ env: ovEnv, http: async () => ({ json: { id: 'order_1', status: 'created' } }) });
        // CARD/INR falls back to razorpay (configured) — must not throw "no provider registered".
        await expect(a.initiate(baseReq({ paymentScheme: 'CARD' }))).resolves.toBeDefined();
        warn.mockRestore();
    });
});

describe('realAdapter — wiring + routing', () => {
    test('IS_PRODUCTION_SAFE is true', () => {
        expect(createRealPaymentProvider({ env: {} }).IS_PRODUCTION_SAFE).toBe(true);
    });

    test('INR request routes to RazorpayX (paise, payout body)', async () => {
        const captured = {};
        const http = async (opts) => {
            captured.opts = opts;
            return { json: { id: 'pout_1', amount: 191750, currency: 'INR', status: 'processing', mode: 'IMPS', reference_id: 'idem-1' } };
        };
        const a = createRealPaymentProvider({ env: envFn(FULL_ENV), http });
        const res = await a.initiate(baseReq());
        expect(captured.opts.url).toMatch(/\/payouts$/); // razorpayx endpoint
        expect(JSON.parse(captured.opts.body).amount).toBe(191750);
        expect(res.status).toBe(PAYMENT_STATUS.PROCESSING);
    });

    test('idempotency is carried on the wire: X-Payout-Idempotency header AND reference_id == idempotencyKey (RazorpayX)', async () => {
        const captured = {};
        const http = async (opts) => {
            captured.opts = opts;
            return { json: { id: 'pout_1', amount: 191750, currency: 'INR', status: 'processing', mode: 'IMPS', reference_id: 'idem-wire' } };
        };
        const a = createRealPaymentProvider({ env: envFn(FULL_ENV), http });
        await a.initiate(baseReq({ idempotencyKey: 'idem-wire' }));
        expect(captured.opts.headers['X-Payout-Idempotency']).toBe('idem-wire');
        expect(JSON.parse(captured.opts.body).reference_id).toBe('idem-wire');
        expect(captured.opts.retries).toBe(0); // money POST never auto-retried
    });

    test('non-INR routes to SWIFT (builds pain.001), bank transport seam throws IntegrationRequiredError by default', async () => {
        const a = createRealPaymentProvider({ env: envFn(FULL_ENV) }); // no swiftTransport -> throwing
        await expect(a.initiate(baseReq({ currency: 'EUR', paymentScheme: 'SWIFT', destinationAccountId: 'FR1420041010050500013M02606' })))
            .rejects.toBeInstanceOf(IntegrationRequiredError);
    });

    test('non-INR routes to SWIFT and completes with an injected real transport', async () => {
        const captured = {};
        const swiftTransport = {
            id: 'fake-h2h',
            async submit(xml) { captured.xml = xml; return { providerRef: 'UETR-1', statusXml: '<Document><TxSts>ACSP</TxSts></Document>' }; },
            async fetchStatus() { return '<Document><TxSts>ACSC</TxSts></Document>'; },
        };
        const a = createRealPaymentProvider({ env: envFn(FULL_ENV), swiftTransport });
        const res = await a.initiate(baseReq({ currency: 'EUR', paymentScheme: 'SWIFT', destinationAccountId: 'FR1420041010050500013M02606' }));
        expect(captured.xml).toContain('<InstdAmt Ccy="EUR">1917.50</InstdAmt>');
        expect(res.rail).toBe(PAYMENT_RAIL.SWIFT);
        expect(res.status).toBe(PAYMENT_STATUS.PROCESSING); // ACSP
    });

    test('timeout on the money POST surfaces IntegrationTimeoutError (fail-closed, never a fake COMPLETED)', async () => {
        const http = async () => { throw new IntegrationTimeoutError('timeout'); };
        const a = createRealPaymentProvider({ env: envFn(FULL_ENV), http });
        await expect(a.initiate(baseReq())).rejects.toBeInstanceOf(IntegrationTimeoutError);
    });

    test('getStatus re-throws a money-rail timeout immediately (no swallow-and-try-next)', async () => {
        let calls = 0;
        const http = async () => { calls += 1; throw new IntegrationTimeoutError('timeout'); };
        const a = createRealPaymentProvider({ env: envFn(FULL_ENV), http });
        await expect(a.getStatus('pout_1')).rejects.toBeInstanceOf(IntegrationTimeoutError);
        expect(calls).toBe(1); // surfaced on the first provider, did not fan out
    });

    test('getStatus swallows a 404 on one provider and tries the next', async () => {
        const { IntegrationHttpError } = require('./../_shared/httpClient');
        let calls = 0;
        const http = async (opts) => {
            calls += 1;
            if (opts.url.includes('/payouts/')) throw new IntegrationHttpError('HTTP 404', { status: 404 });
            return { json: { id: 'order_1', status: 'paid' } }; // razorpay collect order
        };
        const a = createRealPaymentProvider({ env: envFn(FULL_ENV), http });
        const res = await a.getStatus('order_1');
        expect(res.status).toBe(PAYMENT_STATUS.COMPLETED);
        expect(calls).toBeGreaterThan(1); // fanned out past the 404
    });

    test('no provider configured at all -> every method throws IntegrationRequiredError', async () => {
        const a = createRealPaymentProvider({ env: {} });
        await expect(a.initiate(baseReq())).rejects.toBeInstanceOf(IntegrationRequiredError);
        await expect(a.getStatus('x')).rejects.toBeInstanceOf(IntegrationRequiredError);
        await expect(a.cancel('x')).rejects.toBeInstanceOf(IntegrationRequiredError);
    });

    test('selected-but-unconfigured provider throws IntegrationRequiredError (only razorpay configured, INR payout requested)', async () => {
        const onlyCollect = envFn({ RAZORPAY_KEY_ID: 'k', RAZORPAY_KEY_SECRET: 's' });
        const a = createRealPaymentProvider({ env: onlyCollect, http: async () => ({ json: {} }) });
        // INR/IMPS routes to razorpayx which is NOT configured -> IntegrationRequiredError
        await expect(a.initiate(baseReq())).rejects.toBeInstanceOf(IntegrationRequiredError);
    });
});
