'use strict';
// Provider-initiated payment webhooks (async failure/cancellation). NOT user-authenticated — the
// caller is a payment gateway, authenticated by an HMAC signature over the raw body (see
// paymentWebhookAuth). The webhook resolves the order's store server-side, so it is mounted OUTSIDE
// the /stores/:storeId tree. Fails closed when PAYMENT_WEBHOOK_SECRET is unset.
const { Router } = require('express');
const ctrl = require('../controller/orderController');
const { validate } = require('../middleware/validate');
const { verifyPaymentWebhook } = require('../middleware/paymentWebhookAuth');
const { paymentWebhookSchema } = require('../validators/orderSchemas');

const router = Router({ mergeParams: true });

// POST /orders/webhooks/payments  { event:'payment.failed'|'payment.cancelled', orderId, intentId?, reason? }
router.post('/payments', verifyPaymentWebhook, validate(paymentWebhookSchema), ctrl.paymentWebhook);

module.exports = router;
