'use strict';
const { Router } = require('express');
const productCtrl = require('../controller/productController');
const variantCtrl = require('../controller/variantController');
const { validate } = require('../middleware/validate');
const { loadStoreRole, requireStoreRole } = require('../middleware/commerceAccess');
const { createProductSchema, updateProductSchema, bulkUpdateSchema } = require('../validators/productSchemas');
const { createVariantSchema, updateVariantSchema, pricingSchema } = require('../validators/variantSchemas');

const router = Router({ mergeParams: true });

router.get('/', loadStoreRole, productCtrl.listProducts);
router.post('/', loadStoreRole, requireStoreRole('content_editor'), validate(createProductSchema), productCtrl.createProduct);
router.post('/bulk', loadStoreRole, requireStoreRole('content_editor'), validate(bulkUpdateSchema), productCtrl.bulkUpdate);

router.get('/:productId', loadStoreRole, productCtrl.getProduct);
router.patch('/:productId', loadStoreRole, requireStoreRole('content_editor'), validate(updateProductSchema), productCtrl.updateProduct);
router.delete('/:productId', loadStoreRole, requireStoreRole('commerce_manager'), productCtrl.deleteProduct);
router.post('/:productId/publish', loadStoreRole, requireStoreRole('commerce_manager'), productCtrl.publishProduct);
router.post('/:productId/duplicate', loadStoreRole, requireStoreRole('content_editor'), productCtrl.duplicateProduct);

router.get('/:productId/variants', loadStoreRole, variantCtrl.listVariants);
router.post('/:productId/variants', loadStoreRole, requireStoreRole('content_editor'), validate(createVariantSchema), variantCtrl.createVariant);
router.patch('/:productId/variants/:variantId', loadStoreRole, requireStoreRole('content_editor'), validate(updateVariantSchema), variantCtrl.updateVariant);
router.delete('/:productId/variants/:variantId', loadStoreRole, requireStoreRole('commerce_manager'), variantCtrl.deleteVariant);
router.put('/:productId/variants/:variantId/pricing', loadStoreRole, requireStoreRole('content_editor'), validate(pricingSchema), variantCtrl.upsertPricing);
router.put('/:productId/pricing', loadStoreRole, requireStoreRole('content_editor'), validate(pricingSchema), variantCtrl.upsertPricing);

module.exports = router;
