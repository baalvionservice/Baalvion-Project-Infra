'use strict';
const { Router } = require('express');
const ctrl = require('../controller/cartController');
const { validate } = require('../middleware/validate');
const { createCartSchema, addCartItemSchema, updateCartItemSchema } = require('../validators/cartSchemas');

const router = Router({ mergeParams: true });

router.post('/', validate(createCartSchema), ctrl.createCart);
router.get('/:cartId', ctrl.getCart);
router.post('/:cartId/items', validate(addCartItemSchema), ctrl.addItem);
router.patch('/:cartId/items', validate(updateCartItemSchema), ctrl.updateItem);
router.delete('/:cartId/items', ctrl.removeItem);
router.delete('/:cartId', ctrl.clearCart);

module.exports = router;
