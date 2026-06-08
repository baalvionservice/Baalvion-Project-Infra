'use strict';
const { handleRazorpayWebhook, eventTypeForPayout, orderIdFromRef } = require('./paymentWebhookController');

describe('eventTypeForPayout', () => {
    test('maps terminal payout statuses to saga events; non-terminal -> null', () => {
        expect(eventTypeForPayout({ rawStatus: 'processed' })).toBe('payments.transaction.completed');
        expect(eventTypeForPayout({ rawStatus: 'reversed' })).toBe('payments.transaction.reversed');
        expect(eventTypeForPayout({ rawStatus: 'failed' })).toBe('payments.transaction.failed');
        expect(eventTypeForPayout({ rawStatus: 'rejected' })).toBe('payments.transaction.failed');
        expect(eventTypeForPayout({ rawStatus: 'cancelled' })).toBe('payments.transaction.failed');
        expect(eventTypeForPayout({ rawStatus: 'processing' })).toBeNull();
        expect(eventTypeForPayout({ rawStatus: 'queued' })).toBeNull();
    });
});

describe('orderIdFromRef', () => {
    test('strips the order- prefix; tolerant of bad input', () => {
        expect(orderIdFromRef('order-abc-123')).toBe('abc-123');
        expect(orderIdFromRef('abc-123')).toBe('abc-123');
        expect(orderIdFromRef('')).toBeNull();
        expect(orderIdFromRef(null)).toBeNull();
        expect(orderIdFromRef(undefined)).toBeNull();
    });
});

describe('handleRazorpayWebhook', () => {
    const base = { hash: 'h', webhookId: 'evt_1' };
    let apply;
    beforeEach(() => { apply = jest.fn(async () => ({ matched: true, orderId: 'abc', state: 'PAYMENT_CONFIRMED' })); });

    test('401 on bad signature; never applies', async () => {
        const out = await handleRazorpayWebhook(base, { verify: () => false, parse: () => ({}), apply });
        expect(out.status).toBe(401);
        expect(apply).not.toHaveBeenCalled();
    });

    test('400 on unparseable body', async () => {
        const out = await handleRazorpayWebhook(base, { verify: () => true, parse: () => { throw new Error('bad'); }, apply });
        expect(out.status).toBe(400);
        expect(apply).not.toHaveBeenCalled();
    });

    test('200 ignored for a non-terminal payout status', async () => {
        const out = await handleRazorpayWebhook(base, { verify: () => true, parse: () => ({ rawStatus: 'processing', idempotencyKey: 'order-abc' }), apply });
        expect(out.status).toBe(200);
        expect(out.json.ignored).toBe(true);
        expect(apply).not.toHaveBeenCalled();
    });

    test('200 ignored when there is no order reference', async () => {
        const out = await handleRazorpayWebhook(base, { verify: () => true, parse: () => ({ rawStatus: 'processed', idempotencyKey: '' }), apply });
        expect(out.status).toBe(200);
        expect(out.json.ignored).toBe(true);
        expect(apply).not.toHaveBeenCalled();
    });

    test('processed -> applySettlement with mapped event + resolved orderId (webhookId from signed providerId, NOT the header)', async () => {
        const out = await handleRazorpayWebhook(base, { verify: () => true, parse: () => ({ rawStatus: 'processed', idempotencyKey: 'order-abc', providerId: 'pout_1', amount: 1917.5, currency: 'INR' }), apply });
        // 2A: webhookId derives from the signed entity.id (providerId), never from input.webhookId/header.
        expect(apply).toHaveBeenCalledWith(expect.objectContaining({
            webhookId: 'pout_1', eventType: 'payments.transaction.completed', hash: 'h', orderId: 'abc',
            expect: { amount: 1917.5, currency: 'INR' }, requireForward: true, requirePending: true,
        }));
        expect(out.status).toBe(200);
        expect(out.json.event).toBe('payments.transaction.completed');
    });

    test('webhookId ignores the attacker-controllable header and uses providerId', async () => {
        // input.webhookId (the old header source) is present but MUST be ignored.
        const out = await handleRazorpayWebhook({ hash: 'h', webhookId: 'evt_forged' }, { verify: () => true, parse: () => ({ rawStatus: 'processed', idempotencyKey: 'order-abc', providerId: 'pout_9' }), apply });
        expect(apply).toHaveBeenCalledWith(expect.objectContaining({ webhookId: 'pout_9' }));
        expect(out.status).toBe(200);
    });

    test('webhookId falls back to event:hash when providerId is absent', async () => {
        const out = await handleRazorpayWebhook({ hash: 'h' }, { verify: () => true, parse: () => ({ rawStatus: 'processed', idempotencyKey: 'order-abc' }), apply });
        expect(apply).toHaveBeenCalledWith(expect.objectContaining({ webhookId: 'payments.transaction.completed:h' }));
        expect(out.status).toBe(200);
    });

    test('amount/currency mismatch -> 200 {rejected} and the order is NOT advanced', async () => {
        const applyRej = jest.fn(async () => ({ matched: false, rejected: 'amount_or_currency_mismatch', orderId: 'abc' }));
        const out = await handleRazorpayWebhook(base, { verify: () => true, parse: () => ({ rawStatus: 'processed', idempotencyKey: 'order-abc', providerId: 'pout_1', amount: 0.01, currency: 'INR' }), apply: applyRej });
        expect(out.status).toBe(200);
        expect(out.json.rejected).toBe('amount_or_currency_mismatch');
        expect(out.json.result).toBeUndefined();
    });

    test('requirePending rejection -> 200 {rejected:not_pending} (forged settle of an un-initiated order)', async () => {
        const applyRej = jest.fn(async () => ({ matched: false, rejected: 'not_pending', orderId: 'abc' }));
        const out = await handleRazorpayWebhook(base, { verify: () => true, parse: () => ({ rawStatus: 'processed', idempotencyKey: 'order-abc', providerId: 'pout_1', amount: 1917.5, currency: 'INR' }), apply: applyRej });
        expect(out.status).toBe(200);
        expect(out.json.rejected).toBe('not_pending');
    });

    test('forward-guard rejection -> 200 {rejected:illegal_transition} (replay / state regression blocked)', async () => {
        const applyRej = jest.fn(async () => ({ matched: false, rejected: 'illegal_transition', from: 'shipped', orderId: 'abc' }));
        const out = await handleRazorpayWebhook(base, { verify: () => true, parse: () => ({ rawStatus: 'processed', idempotencyKey: 'order-abc', providerId: 'pout_1', amount: 1917.5, currency: 'INR' }), apply: applyRej });
        expect(out.status).toBe(200);
        expect(out.json.rejected).toBe('illegal_transition');
    });

    test('duplicate webhook -> 200 deduped (idempotent inbox)', async () => {
        const applyDup = jest.fn(async () => { const e = new Error('dup'); e.name = 'SequelizeUniqueConstraintError'; throw e; });
        const out = await handleRazorpayWebhook(base, { verify: () => true, parse: () => ({ rawStatus: 'processed', idempotencyKey: 'order-abc' }), apply: applyDup });
        expect(out.status).toBe(200);
        expect(out.json.deduped).toBe(true);
    });

    test('cascade failure -> 500 so the sender retries (at-least-once)', async () => {
        const applyErr = jest.fn(async () => { throw new Error('db down'); });
        const out = await handleRazorpayWebhook(base, { verify: () => true, parse: () => ({ rawStatus: 'processed', idempotencyKey: 'order-abc' }), apply: applyErr });
        expect(out.status).toBe(500);
    });
});
