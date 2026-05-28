'use strict';
const { Router } = require('express');
const ctrl = require('../controller/billingController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/plans', authMiddleware, ctrl.listPlans);
router.post('/subscribe', authMiddleware, ctrl.subscribe);
router.get('/subscription', authMiddleware, ctrl.getSubscription);
router.post('/cancel', authMiddleware, ctrl.cancelSubscription);
router.get('/invoices', authMiddleware, ctrl.listInvoices);

module.exports = router;
