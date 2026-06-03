'use strict';
const { Router } = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const storeRoutes = require('./storeRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const collectionRoutes = require('./collectionRoutes');
const discountRoutes = require('./discountRoutes');
const reviewRoutes = require('./reviewRoutes');
const storefrontRoutes = require('./storefrontRoutes');
const marketController = require('../controller/marketController');

const router = Router();

// Public storefront API (anonymous, read-only, published+public catalog). No authMiddleware.
router.use('/commerce/storefront/:storeId', storefrontRoutes);

// Public market registry (currency / tax / FX per supported country). No authMiddleware.
router.get('/commerce/markets', marketController.list);

router.use('/commerce/stores', authMiddleware, storeRoutes);
router.use('/commerce/stores/:storeId/categories', authMiddleware, categoryRoutes);
router.use('/commerce/stores/:storeId/products/:productId/reviews', authMiddleware, reviewRoutes);
router.use('/commerce/stores/:storeId/products', authMiddleware, productRoutes);
router.use('/commerce/stores/:storeId/collections', authMiddleware, collectionRoutes);
router.use('/commerce/stores/:storeId/discounts', authMiddleware, discountRoutes);

module.exports = router;
