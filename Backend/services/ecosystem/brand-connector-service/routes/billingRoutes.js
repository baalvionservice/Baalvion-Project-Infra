'use strict';
const { Router } = require('express');
const ctrl = require('../controller/billingController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

// Public pricing catalog: active plans are global, non-sensitive marketing data
// read by the unauthenticated landing page (Pricing section). All other billing
// routes below remain auth-gated.
router.get('/plans', ctrl.listPlans);
router.post('/subscribe', authMiddleware, ctrl.subscribe);
router.get('/subscription', authMiddleware, ctrl.getSubscription);
router.post('/cancel', authMiddleware, ctrl.cancelSubscription);
router.get('/invoices', authMiddleware, ctrl.listInvoices);

module.exports = router;
