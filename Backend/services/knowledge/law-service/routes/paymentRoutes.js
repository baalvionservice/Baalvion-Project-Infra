'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/paymentController');

router.get('/',             authMiddleware, ctrl.listPayments);
router.post('/',            authMiddleware, ctrl.createPayment);
router.post('/:id/verify',  authMiddleware, ctrl.verifyPayment);
router.get('/:id',          authMiddleware, ctrl.getPayment);
// NOTE: the Razorpay webhook (POST /payments/webhook) is registered in index.js with a raw
// body parser (signature verification needs the exact bytes), before express.json().

module.exports = router;
