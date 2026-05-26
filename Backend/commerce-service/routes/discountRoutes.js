'use strict';
const { Router } = require('express');
const ctrl = require('../controller/discountController');
const { validate } = require('../middleware/validate');
const { loadStoreRole, requireStoreRole } = require('../middleware/commerceAccess');
const { createDiscountSchema, updateDiscountSchema, validateDiscountSchema } = require('../validators/discountSchemas');

const router = Router({ mergeParams: true });

router.get('/', loadStoreRole, ctrl.listDiscounts);
router.post('/', loadStoreRole, requireStoreRole('commerce_manager'), validate(createDiscountSchema), ctrl.createDiscount);
router.post('/validate', loadStoreRole, validate(validateDiscountSchema), ctrl.validateDiscount);

router.patch('/:discountId', loadStoreRole, requireStoreRole('commerce_manager'), validate(updateDiscountSchema), ctrl.updateDiscount);
router.delete('/:discountId', loadStoreRole, requireStoreRole('commerce_manager'), ctrl.deleteDiscount);

module.exports = router;
