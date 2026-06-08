'use strict';
/**
 * GATED live RazorpayX sandbox test. Skipped unless RAZORPAYX_KEY_ID is set, so
 * CI stays hermetic. Run against the RazorpayX TEST mode only.
 *
 *   RAZORPAYX_KEY_ID=rzp_test_xxx RAZORPAYX_KEY_SECRET=xxx \
 *   RAZORPAYX_ACCOUNT_NUMBER=2323230000000000 \
 *   RAZORPAYX_LIVE_FUND_ACCOUNT=fa_xxx \
 *   npx jest integrations/payment/razorpayx.live.test.js
 *
 * NOTE: a successful initiate originates a REAL test-mode payout. Only use a
 * sandbox fund account. Without a fund account id we just exercise auth via a
 * read that is expected to 4xx cleanly rather than move money.
 */
const { createRazorpayxProvider } = require('./providers/razorpayx');

const live = process.env.RAZORPAYX_KEY_ID ? describe : describe.skip;

live('razorpayx (LIVE sandbox)', () => {
    const provider = createRazorpayxProvider();

    test('adapter reports configured', () => {
        expect(provider.IS_CONFIGURED).toBe(true);
    });

    test('initiate a real test-mode payout when a fund account is provided', async () => {
        const fundAccountId = process.env.RAZORPAYX_LIVE_FUND_ACCOUNT;
        if (!fundAccountId) {
            // No fund account -> skip the money-moving leg, but prove auth works by
            // hitting getStatus on a bogus id and asserting it is an auth-passed 4xx
            // (HTTP error), not an IntegrationRequiredError.
            await expect(provider.getStatus('pout_nonexistent')).rejects.toMatchObject({ name: 'IntegrationHttpError' });
            return;
        }
        const res = await provider.initiate({
            idempotencyKey: `live-${Date.now()}`,
            sourceAccountId: process.env.RAZORPAYX_ACCOUNT_NUMBER,
            destinationAccountId: fundAccountId,
            amount: 1.0,
            currency: 'INR',
            paymentScheme: 'IMPS',
        });
        expect(res.id).toMatch(/^pout_/);
        expect(['PENDING', 'PROCESSING', 'COMPLETED', 'HELD']).toContain(res.status);
    }, 20000);
});
