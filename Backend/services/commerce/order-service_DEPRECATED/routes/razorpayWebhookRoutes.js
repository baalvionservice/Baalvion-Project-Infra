'use strict';
// Razorpay capture backstop. Razorpay POSTs `payment.captured` / `order.paid` here, signed with
// X-Razorpay-Signature over the raw body (verified by verifyRazorpayWebhook). This settles an order
// even when the shopper's browser never returned to confirm (closed mid-redirect / crashed) — the
// gap left by the synchronous client-confirm path. NOT user-authenticated; the signature is the auth.
// Mounted OUTSIDE the /stores/:storeId tree (the order's store is resolved server-side from the
// Razorpay order_id). Idempotent + mutually-exclusive with confirmPayment via the order-row lock.
const { Router } = require('express');
const orderService = require('../service/orderService');
const { verifyRazorpayWebhook } = require('../middleware/razorpayWebhookAuth');

const router = Router({ mergeParams: true });

// Events that settle an order. Anything else is acknowledged (200) and ignored so Razorpay stops
// retrying a webhook we intentionally don't act on.
const CAPTURE_EVENTS = new Set(['payment.captured', 'order.paid']);

router.post('/', verifyRazorpayWebhook, async (req, res, next) => {
    try {
        const body = req.body || {};
        const event = body.event;
        const entity = body.payload && body.payload.payment && body.payload.payment.entity;
        // Resolve the Razorpay order id (entity.order_id on a payment, or entity.id on an order event).
        const orderEntity = body.payload && body.payload.order && body.payload.order.entity;
        const providerOrderId = (entity && entity.order_id) || (orderEntity && orderEntity.id) || null;
        const providerPaymentId = (entity && entity.id) || null;

        if (CAPTURE_EVENTS.has(event) && providerOrderId) {
            await orderService.capturePaymentFromWebhook({
                providerOrderId,
                providerPaymentId,
                amount: entity && entity.amount,
                currencyCode: entity && entity.currency,
            });
        }
        // Always 200 for a signature-valid, well-formed delivery (handled or intentionally ignored)
        // so Razorpay does not retry. Genuine errors propagate to the handler (→ 5xx → Razorpay retries).
        return res.status(200).json({ received: true });
    } catch (err) { return next(err); }
});

module.exports = router;
