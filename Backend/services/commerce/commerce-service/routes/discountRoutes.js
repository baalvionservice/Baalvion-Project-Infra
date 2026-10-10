'use strict';
const { Router } = require('express');
const ctrl = require('../controller/discountController');
const { validate } = require('../middleware/validate');
const { loadStoreRole, requireStoreRole } = require('../middleware/commerceAccess');
const { createDiscountSchema, updateDiscountSchema, validateDiscountSchema } = require('../validators/discountSchemas');

const { adminOnlyOnMarketplace } = require('../middleware/marketplaceGuard');

const router = Router({ mergeParams: true });

router.get('/', loadStoreRole, adminOnlyOnMarketplace, ctrl.listDiscounts);
router.post('/', loadStoreRole, adminOnlyOnMarketplace, requireStoreRole('commerce_manager'), validate(createDiscountSchema), ctrl.createDiscount);
router.post('/validate', loadStoreRole, validate(validateDiscountSchema), ctrl.validateDiscount);

router.patch('/:discountId', loadStoreRole, adminOnlyOnMarketplace, requireStoreRole('commerce_manager'), validate(updateDiscountSchema), ctrl.updateDiscount);
router.delete('/:discountId', loadStoreRole, adminOnlyOnMarketplace, requireStoreRole('commerce_manager'), ctrl.deleteDiscount);

module.exports = router;
