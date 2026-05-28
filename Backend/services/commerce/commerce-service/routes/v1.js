'use strict';
const { Router } = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const storeRoutes = require('./storeRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const collectionRoutes = require('./collectionRoutes');
const discountRoutes = require('./discountRoutes');

const router = Router();

router.use('/commerce/stores', authMiddleware, storeRoutes);
router.use('/commerce/stores/:storeId/categories', authMiddleware, categoryRoutes);
router.use('/commerce/stores/:storeId/products', authMiddleware, productRoutes);
router.use('/commerce/stores/:storeId/collections', authMiddleware, collectionRoutes);
router.use('/commerce/stores/:storeId/discounts', authMiddleware, discountRoutes);

module.exports = router;
