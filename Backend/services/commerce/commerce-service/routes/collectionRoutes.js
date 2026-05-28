'use strict';
const { Router } = require('express');
const ctrl = require('../controller/collectionController');
const { validate } = require('../middleware/validate');
const { loadStoreRole, requireStoreRole } = require('../middleware/commerceAccess');
const { createCollectionSchema, updateCollectionSchema } = require('../validators/collectionSchemas');

const router = Router({ mergeParams: true });

router.get('/', loadStoreRole, ctrl.listCollections);
router.post('/', loadStoreRole, requireStoreRole('content_editor'), validate(createCollectionSchema), ctrl.createCollection);

router.get('/:collectionId', loadStoreRole, ctrl.getCollection);
router.patch('/:collectionId', loadStoreRole, requireStoreRole('content_editor'), validate(updateCollectionSchema), ctrl.updateCollection);
router.delete('/:collectionId', loadStoreRole, requireStoreRole('commerce_manager'), ctrl.deleteCollection);

router.post('/:collectionId/products/:productId', loadStoreRole, requireStoreRole('content_editor'), ctrl.addProduct);
router.delete('/:collectionId/products/:productId', loadStoreRole, requireStoreRole('content_editor'), ctrl.removeProduct);

module.exports = router;
