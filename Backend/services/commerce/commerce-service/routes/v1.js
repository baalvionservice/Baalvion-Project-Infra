'use strict';
const { Router } = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const storeRoutes = require('./storeRoutes');
const categoryRoutes = require('./categoryRoutes');
const adminCategoryRoutes = require('./adminCategoryRoutes');
const productRoutes = require('./productRoutes');
const collectionRoutes = require('./collectionRoutes');
const discountRoutes = require('./discountRoutes');
const reviewRoutes = require('./reviewRoutes');
const storefrontRoutes = require('./storefrontRoutes');
const marketController = require('../controller/marketController');
const mediaServeController = require('../controller/mediaServeController');

const router = Router();

// Public storefront API (anonymous, read-only, published+public catalog). No authMiddleware.
router.use('/commerce/storefront/:storeId', storefrontRoutes);

// Decrypt-and-stream route for encrypted product media (see lib/encryption.js). Public/
// unauthenticated, same trust level as the plaintext static URLs it replaces — see
// controller/mediaServeController.js for why this isn't behind authMiddleware.
router.get('/commerce/media/:mediaId/raw', mediaServeController.serveMedia);

// Public market registry (currency / tax / FX per supported country). No authMiddleware.
router.get('/commerce/markets', marketController.list);

// Platform-scoped (cross-store) category administration — gated by requirePlatformAdmin INSIDE
// the router, per-route (see adminCategoryRoutes.js), same convention as
// order-service/routes/platformAnalyticsRoutes.js.
router.use('/commerce/admin/categories', authMiddleware, adminCategoryRoutes);

router.use('/commerce/stores', authMiddleware, storeRoutes);
router.use('/commerce/stores/:storeId/categories', authMiddleware, categoryRoutes);
router.use('/commerce/stores/:storeId/products/:productId/reviews', authMiddleware, reviewRoutes);
router.use('/commerce/stores/:storeId/products', authMiddleware, productRoutes);
router.use('/commerce/stores/:storeId/collections', authMiddleware, collectionRoutes);
router.use('/commerce/stores/:storeId/discounts', authMiddleware, discountRoutes);

module.exports = router;
