'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/paymentController');

router.get('/',             authMiddleware, ctrl.listPayments);
router.post('/',            authMiddleware, ctrl.createPayment);
router.post('/:id/verify',  authMiddleware, ctrl.verifyPayment);
router.get('/:id',          authMiddleware, ctrl.getPayment);
// NOTE: the Razorpay/Cashfree webhooks (POST /payments/webhook, /payments/cashfree-webhook) are
// registered in index.js with a raw body parser (signature verification needs the exact bytes),
// before express.json(). PayU has no signature header — it form-POSTs the result back, so this
// route is fine behind the ordinary urlencoded/json parsers.
router.post('/payu-webhook', ctrl.payuWebhookHandler);

module.exports = router;
