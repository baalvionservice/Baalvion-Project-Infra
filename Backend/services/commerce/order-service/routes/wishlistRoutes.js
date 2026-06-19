'use strict';
const { Router } = require('express');
const ctrl = require('../controller/wishlistController');
const { validate } = require('../middleware/validate');
const { addWishlistItemSchema } = require('../validators/wishlistSchemas');

// Mounted under authMiddleware (every route requires a valid token; the owner is the JWT userId).
const router = Router({ mergeParams: true });

router.get('/mine', ctrl.getMyWishlist);
router.post('/mine/items', validate(addWishlistItemSchema), ctrl.addItem);
// Optional ?variantId= scopes the delete to a specific variant; absent → remove all product rows.
router.delete('/mine/items/:productId', ctrl.removeItem);

module.exports = router;
