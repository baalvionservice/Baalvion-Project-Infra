'use strict';
const { Router } = require('express');
const productCtrl = require('../controller/productController');
const variantCtrl = require('../controller/variantController');
const mediaCtrl = require('../controller/productMediaController');
const { validate } = require('../middleware/validate');
const { loadStoreRole, requireStoreRole } = require('../middleware/commerceAccess');
const { createProductSchema, updateProductSchema, bulkUpdateSchema } = require('../validators/productSchemas');
const { createVariantSchema, updateVariantSchema, pricingSchema } = require('../validators/variantSchemas');
const { updateMediaSchema, reorderMediaSchema } = require('../validators/mediaSchemas');

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

// Product media library — same authorization as product editing (content_editor to mutate).
// Upload/replace bodies are multipart/form-data (parsed in the controller), so no validate().
router.get('/:productId/media', loadStoreRole, mediaCtrl.listMedia);
router.post('/:productId/media', loadStoreRole, requireStoreRole('content_editor'), mediaCtrl.uploadMedia);
router.post('/:productId/media/reorder', loadStoreRole, requireStoreRole('content_editor'), validate(reorderMediaSchema), mediaCtrl.reorderMedia);
router.patch('/:productId/media/:mediaId', loadStoreRole, requireStoreRole('content_editor'), validate(updateMediaSchema), mediaCtrl.updateMedia);
router.put('/:productId/media/:mediaId', loadStoreRole, requireStoreRole('content_editor'), mediaCtrl.replaceMedia);
router.post('/:productId/media/:mediaId/feature', loadStoreRole, requireStoreRole('content_editor'), mediaCtrl.setFeatured);
router.delete('/:productId/media/:mediaId', loadStoreRole, requireStoreRole('content_editor'), mediaCtrl.deleteMedia);

module.exports = router;
