'use strict';
const router = require('express').Router();
const pw = require('../controller/paymentWebhookController');

// HMAC-authenticated inbound vendor webhooks. NOT user routes — no authMiddleware/tenant
// (the handler verifies X-Razorpay-Signature over the raw body and runs under tenant bypass).
router.post('/razorpay', pw.razorpayWebhook);
// PayU consumer-checkout return (form-POST, SHA-512 reverse-hash verified). Settles the order
// cross-tenant under bypass, then 303-redirects the browser to the order. GET = a cancel bounce.
const pic = require('../controller/paymentIntentController');
router.post('/payu', pic.payuReturn);
router.get('/payu', (req, res) => res.redirect(303, `${(process.env.STOREFRONT_URL || 'http://localhost:9003').replace(/\/+$/, '')}/orders?payu=cancelled`));
router.post('/onfido', require('../controller/kycWebhookController').onfidoWebhook);

module.exports = router;
