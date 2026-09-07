'use strict';
/**
 * The spine wiring, not the spine itself. Every gap found across the estate has been in this
 * layer: data the caller already holds that never reaches the payment record.
 */
const captured = [];

jest.mock('@baalvion/payment-consistency', () => ({
    createPaymentSpine: () => ({
        recordCapture: async (input) => { captured.push(input); return { recorded: true }; },
    }),
    createPaymentOutboxRelay: () => ({ start() {}, async stop() {} }),
    sequelizeQueryRunner: (s) => s,
}));
jest.mock('../models', () => ({ sequelize: {} }));

const spine = require('../service/paymentSpine');

describe('giftcard payment spine wiring', () => {
    beforeEach(() => {
        captured.length = 0;
        process.env.PAYMENT_SPINE = 'true';
    });
    afterEach(() => { delete process.env.PAYMENT_SPINE; });

    it('reports the buyer so the party graph can recognise them elsewhere', async () => {
        await spine.reportOrderPayment({
            orderId: 'ord-1', brandSlug: 'amazon', amountMinor: 4999, currency: 'usd',
            providerRef: 'ch_1', userId: 'user-9', email: 'Buyer@Example.com',
        });

        expect(captured).toHaveLength(1);
        const c = captured[0].customer;
        // Regression: userId used to travel only inside orderRef, which is an opaque string to
        // the panel. The payment landed with no party and never joined up across sites.
        expect(c).toBeDefined();
        expect(c.siteCustomerId).toBe('user-9');
        expect(c.email).toBe('Buyer@Example.com');
        expect(c.emailVerified).toBe(true);
    });

    it('never invents an address the callback did not carry', async () => {
        await spine.reportOrderPayment({
            orderId: 'ord-2', brandSlug: 'amazon', amountMinor: 1000, currency: 'USD',
            providerRef: 'ch_2', userId: 'user-9',
        });
        expect(captured[0].customer.email).toBeNull();
        expect(captured[0].customer.emailVerified).toBe(false);
        expect(captured[0].customer.siteCustomerId).toBe('user-9');
    });

    it('attributes the brand as the tenant and normalises the currency', async () => {
        await spine.reportOrderPayment({
            orderId: 'ord-3', brandSlug: 'steam', amountMinor: 2500, currency: 'usd',
            providerRef: 'ch_3', userId: 'u1',
        });
        expect(captured[0].tenantId).toBe('giftcard:steam');
        expect(captured[0].currency).toBe('USD');
        expect(captured[0].amountMinor).toBe(2500);
    });

    it('is a no-op when the spine is off, touching nothing', async () => {
        delete process.env.PAYMENT_SPINE;
        expect(await spine.reportOrderPayment({ orderId: 'x', amountMinor: 1, currency: 'USD' })).toBeNull();
        expect(captured).toHaveLength(0);
    });

    it('sells under the community site, which is where gift cards are sold', () => {
        expect(spine.SITE_ID).toBe('community');
        // A wallet purchase is settled from a balance funded by crypto — same rail, not a new one.
        expect(spine.railFor('crypto')).toBe('crypto');
        expect(spine.railFor('wallet')).toBe('crypto');
        expect(spine.railFor('razorpay')).toBeUndefined();
    });
});
