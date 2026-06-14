'use strict';
const { Router } = require('express');
const ctrl = require('../controller/cartController');
const { validate } = require('../middleware/validate');
const { createCartSchema, addCartItemSchema, updateCartItemSchema } = require('../validators/cartSchemas');

const router = Router({ mergeParams: true });

// Guest-capable: mounted under optionalAuth. Ownership is enforced in the service layer by
// authenticated userId OR a valid signed X-Cart-Session (guest) OR store staff.
router.post('/', validate(createCartSchema), ctrl.createCart);
router.get('/:cartId', ctrl.getCart);
router.post('/:cartId/items', validate(addCartItemSchema), ctrl.addItem);
router.patch('/:cartId/items', validate(updateCartItemSchema), ctrl.updateItem);
router.delete('/:cartId/items', ctrl.removeItem);
router.delete('/:cartId', ctrl.clearCart);
// Claim-on-login (the service requires an authenticated actor + a matching signed guest session).
router.post('/:cartId/claim', ctrl.claimCart);

module.exports = router;
