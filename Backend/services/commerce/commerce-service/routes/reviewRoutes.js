'use strict';
// Authenticated review routes — mounted under /commerce/stores/:storeId/products/:productId/reviews
// with authMiddleware (RS256) in v1.js. Customer self-service (submit / read own) plus store-team
// moderation (list any-status / set status + reply). Public read-only listing lives on the
// storefront routes instead. Moderation is gated by the shared RBAC PEP (loadStoreRole +
// requireStoreRole), matching productRoutes.
const { Router } = require('express');
const ctrl = require('../controller/reviewController');
const { validate } = require('../middleware/validate');
const { loadStoreRole, requireStoreRole } = require('../middleware/commerceAccess');
const { createReviewSchema, moderateReviewSchema } = require('../validators/reviewSchemas');

const router = Router({ mergeParams: true });

// Customer self-service (any authenticated user; no store role required).
router.post('/', validate(createReviewSchema), ctrl.createReview);
router.get('/mine', ctrl.getMyReview);

// Store-team moderation.
router.get('/', loadStoreRole, requireStoreRole('store_viewer'), ctrl.listAllReviews);
router.patch('/:reviewId', loadStoreRole, requireStoreRole('content_editor'), validate(moderateReviewSchema), ctrl.moderateReview);

module.exports = router;
