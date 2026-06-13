'use strict';
const { Router } = require('express');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const orderRoutes = require('./orderRoutes');
const customerRoutes = require('./customerRoutes');
const cartRoutes = require('./cartRoutes');
const returnRoutes = require('./returnRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const platformAnalyticsRoutes = require('./platformAnalyticsRoutes');
const paymentWebhookRoutes = require('./paymentWebhookRoutes');
const razorpayWebhookRoutes = require('./razorpayWebhookRoutes');
const reconciliationRoutes = require('./reconciliationRoutes');

const router = Router();

// Platform-scoped (cross-store) order analytics. MUST precede the /orders/stores/:storeId mounts so
// the literal '/orders/analytics' segment is matched before ':storeId' could swallow 'analytics'.
// Auth (authMiddleware + requirePlatformAdmin) is applied INSIDE the router, per-route.
router.use('/orders/analytics', platformAnalyticsRoutes);

// Provider payment webhooks (signature-authenticated, not user-auth). Mounted OUTSIDE the store tree
// (the webhook resolves the store from the order). Also precedes /orders/stores/:storeId.
// Razorpay capture backstop (more specific → mounted first); X-Razorpay-Signature over the raw body.
router.use('/orders/webhooks/razorpay', razorpayWebhookRoutes);
router.use('/orders/webhooks', paymentWebhookRoutes);

router.use('/orders/stores/:storeId/analytics', authMiddleware, analyticsRoutes);
router.use('/orders/stores/:storeId/reconciliation', authMiddleware, reconciliationRoutes);
// Orders support guest checkout: optionalAuth admits anonymous shoppers on the shopper-facing
// routes (create / read-own / pay), mirroring carts. Admin/ops routes inside orderRoutes re-apply
// authMiddleware explicitly, so listing/mutating other customers' orders still REQUIRES full auth.
// Guest ownership is enforced in-service via the signed X-Cart-Session (same mechanism as carts).
router.use('/orders/stores/:storeId/orders', optionalAuth, orderRoutes);
router.use('/orders/stores/:storeId/customers', authMiddleware, customerRoutes);
// Carts support guest checkout: optionalAuth admits anonymous shoppers; ownership is enforced
// in-service via a signed guest session (X-Cart-Session) or the authenticated userId.
router.use('/orders/stores/:storeId/carts', optionalAuth, cartRoutes);
// Returns support guest checkout: optionalAuth admits anonymous shoppers on the shopper-facing
// create-return route (ownership via the signed X-Cart-Session, same mechanism as guest orders).
// Admin routes (list/process) and the customer "my returns" route RE-APPLY authMiddleware inside
// returnRoutes, so a guest is 401'd there. Guest ownership is enforced in-service via ownerSessionId.
router.use('/orders/stores/:storeId/returns', optionalAuth, returnRoutes);

module.exports = router;
