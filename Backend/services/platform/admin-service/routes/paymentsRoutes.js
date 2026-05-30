'use strict';
// Billing/payments console routes. Mounted under /v1/admin/payments (inherits the
// requireSuperAdmin gate from adminRoutes).
const router = require('express').Router();
const ctrl = require('../controller/paymentsController');

router.get('/summary', ctrl.summary);

router.get('/transactions', ctrl.listTransactions);
router.get('/transactions/:id', ctrl.getTransaction);

router.get('/subscriptions', ctrl.listSubscriptions);
router.get('/subscriptions/:id', ctrl.getSubscription);
router.post('/subscriptions/:id/cancel', ctrl.cancelSubscription);

router.get('/invoices', ctrl.listInvoices);
router.get('/invoices/:id', ctrl.getInvoice);

router.get('/refunds', ctrl.listRefunds);
router.post('/refunds', ctrl.createRefund);

router.get('/webhooks', ctrl.listWebhooks);
router.post('/webhooks/:id/retry', ctrl.retryWebhook);

module.exports = router;
