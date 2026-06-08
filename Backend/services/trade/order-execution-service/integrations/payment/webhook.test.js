'use strict';
const { verifyRazorpayWebhook, parsePayoutEvent } = require('./webhook');
const { hmacSha256Hex } = require('../_shared/signature');
const { PAYMENT_STATUS } = require('./contract');

const SECRET = 'whsec_payout';

describe('payment webhook — signature verification', () => {
    const body = JSON.stringify({
        event: 'payout.processed',
        payload: { payout: { entity: { id: 'pout_1', status: 'processed', reference_id: 'idem-1', amount: 191750, currency: 'INR' } } },
    });

    test('verifies a correct X-Razorpay-Signature, rejects tampered', () => {
        const sig = hmacSha256Hex(SECRET, body);
        expect(verifyRazorpayWebhook({ rawBody: body, signatureHeader: sig, secret: SECRET })).toBe(true);
        expect(verifyRazorpayWebhook({ rawBody: body + ' ', signatureHeader: sig, secret: SECRET })).toBe(false);
        expect(verifyRazorpayWebhook({ rawBody: body, signatureHeader: 'deadbeef', secret: SECRET })).toBe(false);
        expect(verifyRazorpayWebhook({ rawBody: body, signatureHeader: sig, secret: 'wrong' })).toBe(false);
    });

    test('missing inputs verify false (fail-closed)', () => {
        expect(verifyRazorpayWebhook({ rawBody: null, signatureHeader: 'x', secret: SECRET })).toBe(false);
        expect(verifyRazorpayWebhook({ rawBody: '{}', signatureHeader: '', secret: SECRET })).toBe(false);
        expect(verifyRazorpayWebhook({ rawBody: '{}', signatureHeader: 'x', secret: '' })).toBe(false);
    });
});

describe('payment webhook — payout event normalization', () => {
    test('parses the standard envelope into providerId/idempotencyKey/status/amount/currency', () => {
        const body = { event: 'payout.processed', payload: { payout: { entity: { id: 'pout_9', status: 'processed', reference_id: 'idem-9', amount: 191750, currency: 'INR' } } } };
        const ev = parsePayoutEvent(body);
        expect(ev.providerId).toBe('pout_9');
        expect(ev.idempotencyKey).toBe('idem-9');
        expect(ev.status).toBe(PAYMENT_STATUS.COMPLETED);
        expect(ev.event).toBe('payout.processed');
        // 3A: paise (191750) -> MAJOR units (1917.50) so it can bind to the order total.
        expect(ev.amount).toBe(1917.5);
        expect(ev.currency).toBe('INR');
    });

    test('amount is null when absent or non-finite (a forged/missing amount can never settle)', () => {
        const noAmt = parsePayoutEvent({ id: 'p', status: 'processed', reference_id: 'i' });
        expect(noAmt.amount).toBeNull();
        expect(noAmt.currency).toBeNull();
        const badAmt = parsePayoutEvent({ id: 'p', status: 'processed', reference_id: 'i', amount: 'NaN', currency: 'INR' });
        expect(badAmt.amount).toBeNull();
    });

    test('maps reversed -> FAILED and accepts a bare entity', () => {
        const ev = parsePayoutEvent({ id: 'pout_2', status: 'reversed', reference_id: 'idem-2' });
        expect(ev.status).toBe(PAYMENT_STATUS.FAILED);
        expect(ev.idempotencyKey).toBe('idem-2');
    });

    test('accepts a JSON string body', () => {
        const ev = parsePayoutEvent(JSON.stringify({ payload: { payout: { entity: { id: 'p3', status: 'queued', reference_id: 'i3' } } } }));
        expect(ev.providerId).toBe('p3');
        expect(ev.status).toBe(PAYMENT_STATUS.PENDING);
    });

    test('throws on unparseable body', () => {
        expect(() => parsePayoutEvent('not-json')).toThrow();
    });
});
