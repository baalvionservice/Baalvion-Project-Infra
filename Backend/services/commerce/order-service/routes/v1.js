'use strict';
const { Router } = require('express');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const orderRoutes = require('./orderRoutes');
const customerRoutes = require('./customerRoutes');
const cartRoutes = require('./cartRoutes');
const returnRoutes = require('./returnRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const reconciliationRoutes = require('./reconciliationRoutes');

const router = Router();

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
router.use('/orders/stores/:storeId/returns', authMiddleware, returnRoutes);

module.exports = router;
