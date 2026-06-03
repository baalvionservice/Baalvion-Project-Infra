'use strict';
// PUBLIC storefront routes (no auth) — read-only access to published, public catalog.
// Mounted in v1.js WITHOUT authMiddleware. Writes/admin remain on the authed routes.
const { Router } = require('express');
const ctrl = require('../controller/storefrontController');

const router = Router({ mergeParams: true });

router.get('/products', ctrl.listProducts);
router.get('/products/:idOrSlug/reviews', ctrl.listReviews);
router.get('/products/:idOrSlug/related', ctrl.listRelated);
router.get('/products/:idOrSlug', ctrl.getProduct);
router.get('/departments', ctrl.listDepartments);
router.get('/categories', ctrl.listCategories);
router.get('/collections', ctrl.listCollections);

module.exports = router;
