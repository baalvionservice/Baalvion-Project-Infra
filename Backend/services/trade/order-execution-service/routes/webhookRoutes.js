'use strict';
const router = require('express').Router();
const pw = require('../controller/paymentWebhookController');

// HMAC-authenticated inbound vendor webhooks. NOT user routes — no authMiddleware/tenant
// (the handler verifies X-Razorpay-Signature over the raw body and runs under tenant bypass).
router.post('/razorpay', pw.razorpayWebhook);
router.post('/onfido', require('../controller/kycWebhookController').onfidoWebhook);

module.exports = router;
