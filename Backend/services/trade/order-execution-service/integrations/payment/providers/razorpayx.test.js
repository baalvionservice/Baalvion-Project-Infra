'use strict';
const { createRazorpayxProvider, toPaise, mapStatus } = require('./razorpayx');
const { PAYMENT_STATUS } = require('../contract');
const { IntegrationTimeoutError } = require('../../_shared/httpClient');
const { IntegrationRequiredError } = require('../../IntegrationRequiredError');

const ENV = {
    RAZORPAYX_KEY_ID: 'rzp_test_key',
    RAZORPAYX_KEY_SECRET: 'secret',
    RAZORPAYX_ACCOUNT_NUMBER: '2323230000000000',
};
const envFn = (map) => (name) => map[name];

/** Fake `http` matching the shared request() contract: returns {json,status}. */
function fakeHttp(captured, response) {
    return async (opts) => {
        captured.opts = opts;
        if (typeof response === 'function') return response(opts);
        return response;
    };
}

const payoutEntity = (over = {}) => ({
    id: 'pout_123',
    entity: 'payout',
    amount: 191750,
    currency: 'INR',
    status: 'processing',
    mode: 'IMPS',
    reference_id: 'idem-1',
    utr: null,
    ...over,
});

const baseReq = (over = {}) => ({
    idempotencyKey: 'idem-1',
    // no sourceAccountId by default -> falls back to configured RAZORPAYX_ACCOUNT_NUMBER
    destinationAccountId: 'fa_dest_1',
    amount: 1917.5,
    currency: 'INR',
    paymentScheme: 'IMPS',
    ...over,
});

describe('razorpayx — amount + status mapping', () => {
    test('toPaise rounds major-unit to integer paise (no float drift)', () => {
        expect(toPaise(1917.5)).toBe(191750);
        expect(toPaise(19.99)).toBe(1999);
        expect(toPaise(0)).toBe(0);
    });

    test('toPaise rejects invalid amounts', () => {
        expect(() => toPaise(-1)).toThrow();
        expect(() => toPaise(NaN)).toThrow();
        expect(() => toPaise('5')).toThrow();
    });

    test('maps every vendor payout status', () => {
        expect(mapStatus('queued')).toBe(PAYMENT_STATUS.PENDING);
        expect(mapStatus('pending')).toBe(PAYMENT_STATUS.PENDING);
        expect(mapStatus('processing')).toBe(PAYMENT_STATUS.PROCESSING);
        expect(mapStatus('processed')).toBe(PAYMENT_STATUS.COMPLETED);
        expect(mapStatus('reversed')).toBe(PAYMENT_STATUS.FAILED);
        expect(mapStatus('cancelled')).toBe(PAYMENT_STATUS.CANCELLED);
        expect(mapStatus('rejected')).toBe(PAYMENT_STATUS.FAILED);
        expect(mapStatus('failed')).toBe(PAYMENT_STATUS.FAILED);
        expect(mapStatus('on_hold')).toBe(PAYMENT_STATUS.HELD);
    });

    test('unknown status maps to PROCESSING (never assume success)', () => {
        expect(mapStatus('martian')).toBe(PAYMENT_STATUS.PROCESSING);
    });
});

describe('razorpayx — initiate', () => {
    test('converts amount to paise, sets mode/reference_id/idempotency header', async () => {
        const captured = {};
        const http = fakeHttp(captured, { json: payoutEntity() });
        const p = createRazorpayxProvider({ env: envFn(ENV), http });

        const res = await p.initiate(baseReq());

        const body = JSON.parse(captured.opts.body);
        expect(body.amount).toBe(191750);
        expect(body.currency).toBe('INR');
        expect(body.mode).toBe('IMPS');
        expect(body.fund_account_id).toBe('fa_dest_1');
        expect(body.reference_id).toBe('idem-1');
        expect(body.queue_if_low_balance).toBe(true);
        expect(captured.opts.headers['X-Payout-Idempotency']).toBe('idem-1');
        expect(captured.opts.headers.Authorization).toMatch(/^Basic /);
        expect(captured.opts.retries).toBe(0); // money POST never auto-retried

        expect(res.id).toBe('pout_123');
        expect(res.idempotencyKey).toBe('idem-1');
        expect(res.status).toBe(PAYMENT_STATUS.PROCESSING);
        expect(res.amount).toBe(1917.5);
        expect(res.currency).toBe('INR');
    });

    test('UPI scheme routes to UPI mode', async () => {
        const captured = {};
        const http = fakeHttp(captured, { json: payoutEntity({ mode: 'UPI' }) });
        const p = createRazorpayxProvider({ env: envFn(ENV), http });
        await p.initiate(baseReq({ paymentScheme: 'UPI' }));
        expect(JSON.parse(captured.opts.body).mode).toBe('UPI');
    });

    test('NEFT scheme sets wire mode=NEFT', async () => {
        const captured = {};
        const http = fakeHttp(captured, { json: payoutEntity({ mode: 'NEFT' }) });
        const p = createRazorpayxProvider({ env: envFn(ENV), http });
        await p.initiate(baseReq({ paymentScheme: 'NEFT' }));
        expect(JSON.parse(captured.opts.body).mode).toBe('NEFT');
    });

    test('RTGS scheme sets wire mode=RTGS', async () => {
        const captured = {};
        const http = fakeHttp(captured, { json: payoutEntity({ mode: 'RTGS' }) });
        const p = createRazorpayxProvider({ env: envFn(ENV), http });
        await p.initiate(baseReq({ paymentScheme: 'RTGS' }));
        expect(JSON.parse(captured.opts.body).mode).toBe('RTGS');
    });

    test('account_number defaults to configured RAZORPAYX_ACCOUNT_NUMBER when no sourceAccountId', async () => {
        const captured = {};
        const http = fakeHttp(captured, { json: payoutEntity() });
        const p = createRazorpayxProvider({ env: envFn(ENV), http });
        await p.initiate(baseReq()); // no sourceAccountId
        expect(JSON.parse(captured.opts.body).account_number).toBe(ENV.RAZORPAYX_ACCOUNT_NUMBER);
    });

    test('a real sourceAccountId is used as account_number', async () => {
        const captured = {};
        const http = fakeHttp(captured, { json: payoutEntity() });
        const p = createRazorpayxProvider({ env: envFn(ENV), http });
        await p.initiate(baseReq({ sourceAccountId: '9999990000000000' }));
        expect(JSON.parse(captured.opts.body).account_number).toBe('9999990000000000');
    });

    test('reversed payout surfaces failureReason=reversed', async () => {
        const http = fakeHttp({}, { json: payoutEntity({ status: 'reversed' }) });
        const p = createRazorpayxProvider({ env: envFn(ENV), http });
        const res = await p.initiate(baseReq());
        expect(res.status).toBe(PAYMENT_STATUS.FAILED);
        expect(res.failureReason).toBe('reversed');
    });

    test('rejects non-INR currency so the router can fall through to SWIFT', async () => {
        const p = createRazorpayxProvider({ env: envFn(ENV), http: fakeHttp({}, {}) });
        await expect(p.initiate(baseReq({ currency: 'EUR' }))).rejects.toMatchObject({ code: 'UNSUPPORTED_CURRENCY' });
    });

    test('timeout surfaces IntegrationTimeoutError (fail-closed, no fake COMPLETED)', async () => {
        const http = async () => { throw new IntegrationTimeoutError('timeout after 8000ms calling api.razorpay.com'); };
        const p = createRazorpayxProvider({ env: envFn(ENV), http });
        await expect(p.initiate(baseReq())).rejects.toBeInstanceOf(IntegrationTimeoutError);
    });

    test('unconfigured -> IntegrationRequiredError naming missing env', async () => {
        const p = createRazorpayxProvider({ env: envFn({}), http: fakeHttp({}, {}) });
        expect(p.IS_CONFIGURED).toBe(false);
        await expect(p.initiate(baseReq())).rejects.toBeInstanceOf(IntegrationRequiredError);
    });
});

describe('razorpayx — getStatus / cancel', () => {
    test('getStatus reads payout and maps status', async () => {
        const captured = {};
        const http = fakeHttp(captured, { json: payoutEntity({ status: 'processed', utr: 'UTR123' }) });
        const p = createRazorpayxProvider({ env: envFn(ENV), http });
        const res = await p.getStatus('pout_123');
        expect(captured.opts.url).toMatch(/\/payouts\/pout_123$/);
        expect(captured.opts.method).toBe('GET');
        expect(res.status).toBe(PAYMENT_STATUS.COMPLETED);
        expect(res.providerRef).toBe('UTR123');
    });

    test('cancel posts to /cancel and maps cancelled', async () => {
        const captured = {};
        const http = fakeHttp(captured, { json: payoutEntity({ status: 'cancelled' }) });
        const p = createRazorpayxProvider({ env: envFn(ENV), http });
        const res = await p.cancel('pout_123');
        expect(captured.opts.url).toMatch(/\/payouts\/pout_123\/cancel$/);
        expect(captured.opts.method).toBe('POST');
        expect(res.status).toBe(PAYMENT_STATUS.CANCELLED);
    });
});
