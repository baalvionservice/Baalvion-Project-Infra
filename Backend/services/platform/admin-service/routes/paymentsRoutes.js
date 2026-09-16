'use strict';
// Billing/payments console routes. Mounted under /v1/admin/payments (inherits the
// requireSuperAdmin gate from adminRoutes).
const router = require('express').Router();
const ctrl = require('../controller/paymentsController');

router.get('/summary', ctrl.summary);

// Cross-estate payment feed — every payment on every site, from the read model rather than a
// live fan-out. `/records/summary` groups by site AND currency and never sums across them.
router.get('/records', ctrl.listPaymentRecords);
router.get('/records/summary', ctrl.paymentRecordsSummary);

// Party graph — the identity behind the payments, and the queue of matches a human must settle.
// Reading is staff-admin like the rest of this router. RESOLVING is super-admin only: a merge
// permanently joins two people's payment history, which sits with deleteUser and impersonate
// rather than with ordinary console work, and it is not cleanly reversible.
const { requireSuperAdmin } = require('../middleware/authMiddleware');

router.get('/parties/reviews', ctrl.listPartyReviews);
router.post('/parties/reviews/:id/resolve', requireSuperAdmin, ctrl.resolvePartyReview);
router.get('/parties/:id', ctrl.getParty);

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
