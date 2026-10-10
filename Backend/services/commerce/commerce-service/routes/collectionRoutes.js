'use strict';
const { Router } = require('express');
const ctrl = require('../controller/collectionController');
const { validate } = require('../middleware/validate');
const { loadStoreRole, requireStoreRole } = require('../middleware/commerceAccess');
const { createCollectionSchema, updateCollectionSchema } = require('../validators/collectionSchemas');

const { adminOnlyOnMarketplace } = require('../middleware/marketplaceGuard');

const router = Router({ mergeParams: true });

router.get('/', loadStoreRole, ctrl.listCollections);
router.post('/', loadStoreRole, adminOnlyOnMarketplace, requireStoreRole('content_editor'), validate(createCollectionSchema), ctrl.createCollection);

router.get('/:collectionId', loadStoreRole, ctrl.getCollection);
router.patch('/:collectionId', loadStoreRole, adminOnlyOnMarketplace, requireStoreRole('content_editor'), validate(updateCollectionSchema), ctrl.updateCollection);
router.delete('/:collectionId', loadStoreRole, adminOnlyOnMarketplace, requireStoreRole('commerce_manager'), ctrl.deleteCollection);

router.post('/:collectionId/products/:productId', loadStoreRole, adminOnlyOnMarketplace, requireStoreRole('content_editor'), ctrl.addProduct);
router.delete('/:collectionId/products/:productId', loadStoreRole, adminOnlyOnMarketplace, requireStoreRole('content_editor'), ctrl.removeProduct);

module.exports = router;
