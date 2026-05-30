'use strict';
const { Router } = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const orderRoutes = require('./orderRoutes');
const customerRoutes = require('./customerRoutes');
const cartRoutes = require('./cartRoutes');
const returnRoutes = require('./returnRoutes');
const analyticsRoutes = require('./analyticsRoutes');

const router = Router();

router.use('/orders/stores/:storeId/analytics', authMiddleware, analyticsRoutes);
router.use('/orders/stores/:storeId/orders', authMiddleware, orderRoutes);
router.use('/orders/stores/:storeId/customers', authMiddleware, customerRoutes);
router.use('/orders/stores/:storeId/carts', authMiddleware, cartRoutes);
router.use('/orders/stores/:storeId/returns', authMiddleware, returnRoutes);

module.exports = router;
