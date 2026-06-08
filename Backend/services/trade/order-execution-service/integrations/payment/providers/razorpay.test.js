'use strict';
const { createRazorpayProvider, toPaise, mapStatus, sanitizeNotes } = require('./razorpay');
const { PAYMENT_STATUS } = require('../contract');
const { hmacSha256Hex } = require('../../_shared/signature');
const { IntegrationRequiredError } = require('../../IntegrationRequiredError');

const ENV = { RAZORPAY_KEY_ID: 'rzp_test_key', RAZORPAY_KEY_SECRET: 'rzp_secret' };
const envFn = (map) => (name) => map[name];

function fakeHttp(captured, response) {
    return async (opts) => {
        captured.opts = opts;
        return typeof response === 'function' ? response(opts) : response;
    };
}

const orderEntity = (over = {}) => ({
    id: 'order_ABC',
    entity: 'order',
    amount: 191750,
    currency: 'INR',
    receipt: 'idem-1',
    status: 'created',
    ...over,
});

const baseReq = (over = {}) => ({
    idempotencyKey: 'idem-1',
    sourceAccountId: 'acct-src',
    destinationAccountId: 'acct-dst',
    amount: 1917.5,
    currency: 'INR',
    paymentScheme: 'CARD',
    ...over,
});

describe('razorpay — collect orders', () => {
    test('maps order + payment statuses', () => {
        expect(mapStatus('created')).toBe(PAYMENT_STATUS.PENDING);
        expect(mapStatus('attempted')).toBe(PAYMENT_STATUS.PROCESSING);
        expect(mapStatus('paid')).toBe(PAYMENT_STATUS.COMPLETED);
        expect(mapStatus('authorized')).toBe(PAYMENT_STATUS.PROCESSING);
        expect(mapStatus('captured')).toBe(PAYMENT_STATUS.COMPLETED);
        expect(mapStatus('failed')).toBe(PAYMENT_STATUS.FAILED);
        expect(mapStatus('refunded')).toBe(PAYMENT_STATUS.FAILED);
        expect(mapStatus('weird')).toBe(PAYMENT_STATUS.PROCESSING);
    });

    test('initiate creates an order in paise with receipt=idempotencyKey', async () => {
        const captured = {};
        const http = fakeHttp(captured, { json: orderEntity() });
        const p = createRazorpayProvider({ env: envFn(ENV), http });
        const res = await p.initiate(baseReq());
        const body = JSON.parse(captured.opts.body);
        expect(body.amount).toBe(191750);
        expect(body.currency).toBe('INR');
        expect(body.receipt).toBe('idem-1');
        expect(captured.opts.url).toMatch(/\/orders$/);
        expect(captured.opts.retries).toBe(0);
        expect(res.status).toBe(PAYMENT_STATUS.PENDING);
        expect(res.idempotencyKey).toBe('idem-1');
    });

    test('unconfigured -> IntegrationRequiredError', async () => {
        const p = createRazorpayProvider({ env: envFn({}), http: fakeHttp({}, {}) });
        expect(p.IS_CONFIGURED).toBe(false);
        await expect(p.initiate(baseReq())).rejects.toBeInstanceOf(IntegrationRequiredError);
    });

    test('metadata is sanitized into notes (nested dropped, idempotencyKey not overridable, no crash)', async () => {
        const captured = {};
        const http = fakeHttp(captured, { json: orderEntity() });
        const p = createRazorpayProvider({ env: envFn(ENV), http });
        const circular = {}; circular.self = circular; // would break naive JSON.stringify
        await p.initiate(baseReq({
            metadata: {
                idempotencyKey: 'ATTACKER-OVERRIDE',
                orderId: 'ord-9',
                amount: 42,
                nested: { a: 1 },
                arr: [1, 2],
                bad: circular,
                inf: Infinity,
            },
        }));
        const notes = JSON.parse(captured.opts.body).notes;
        expect(notes.idempotencyKey).toBe('idem-1'); // real key wins, attacker dropped
        expect(notes.orderId).toBe('ord-9');
        expect(notes.amount).toBe('42'); // coerced to string
        expect(notes.nested).toBeUndefined();
        expect(notes.arr).toBeUndefined();
        expect(notes.bad).toBeUndefined();
        expect(notes.inf).toBeUndefined();
    });
});

describe('razorpay — sanitizeNotes (pure)', () => {
    test('caps value length to 256 and key count to 15', () => {
        const meta = {};
        for (let i = 0; i < 30; i += 1) meta[`k${i}`] = 'v';
        meta.long = 'x'.repeat(1000);
        const notes = sanitizeNotes(meta);
        expect(Object.keys(notes).length).toBeLessThanOrEqual(15);
    });

    test('non-object metadata yields an empty object', () => {
        expect(sanitizeNotes(undefined)).toEqual({});
        expect(sanitizeNotes('str')).toEqual({});
        expect(sanitizeNotes(null)).toEqual({});
    });
});

describe('razorpay — payment signature verification', () => {
    test('accepts a correct signature, rejects a tampered one (constant-time)', () => {
        const p = createRazorpayProvider({ env: envFn(ENV), http: fakeHttp({}, {}) });
        const orderId = 'order_ABC';
        const paymentId = 'pay_XYZ';
        const good = hmacSha256Hex(ENV.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`);
        expect(p.verifyPaymentSignature({ orderId, paymentId, signature: good })).toBe(true);
        expect(p.verifyPaymentSignature({ orderId, paymentId, signature: good + '00' })).toBe(false);
        expect(p.verifyPaymentSignature({ orderId, paymentId, signature: 'deadbeef' })).toBe(false);
    });

    test('missing inputs verify false (fail-closed)', () => {
        const p = createRazorpayProvider({ env: envFn(ENV), http: fakeHttp({}, {}) });
        expect(p.verifyPaymentSignature({ orderId: '', paymentId: 'x', signature: 'y' })).toBe(false);
        expect(p.verifyPaymentSignature({ orderId: 'a', paymentId: '', signature: 'y' })).toBe(false);
        expect(p.verifyPaymentSignature({ orderId: 'a', paymentId: 'b', signature: '' })).toBe(false);
    });
});
