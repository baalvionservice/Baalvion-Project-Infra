'use strict';
const router = require('express').Router();
const ctrl = require('../controller/paymentsController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Which providers are actually configured right now — drives the checkout UI.
router.get('/provider', ctrl.providerStatus);

// Must be logged in to start a real checkout (the charge is attributed to req.user.id).
router.post('/checkout', authMiddleware, ctrl.createCheckout);

// Razorpay calls this directly — no user auth, verified via HMAC signature instead.
router.post('/webhook', ctrl.handleWebhook);

module.exports = router;
