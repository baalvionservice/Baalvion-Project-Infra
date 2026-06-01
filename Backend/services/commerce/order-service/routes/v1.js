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
router.use('/orders/stores/:storeId/orders', authMiddleware, orderRoutes);
router.use('/orders/stores/:storeId/customers', authMiddleware, customerRoutes);
// Carts support guest checkout: optionalAuth admits anonymous shoppers; ownership is enforced
// in-service via a signed guest session (X-Cart-Session) or the authenticated userId.
router.use('/orders/stores/:storeId/carts', optionalAuth, cartRoutes);
router.use('/orders/stores/:storeId/returns', authMiddleware, returnRoutes);

module.exports = router;
