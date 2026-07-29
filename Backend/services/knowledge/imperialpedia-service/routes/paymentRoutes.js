'use strict';
const router = require('express').Router();
const ctrl = require('../controller/paymentsController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

// Which providers are actually configured right now — drives the checkout UI.
router.get('/provider', ctrl.providerStatus);

// Public pricing (server-authoritative — the same `plans` rows /checkout charges from).
router.get('/plans', ctrl.listPlans);

// Anonymous visitors get activeTier: null; a logged-in visitor gets their real tier.
router.get('/subscription', optionalAuth, ctrl.myActiveSubscription);

// Must be logged in to start a real checkout (the charge is attributed to req.user.id).
router.post('/checkout', authMiddleware, ctrl.createCheckout);

// Razorpay calls this directly — no user auth, verified via HMAC signature instead.
router.post('/webhook', ctrl.handleWebhook);

module.exports = router;
