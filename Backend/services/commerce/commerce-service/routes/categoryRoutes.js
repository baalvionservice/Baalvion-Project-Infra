'use strict';
const { Router } = require('express');
const ctrl = require('../controller/categoryController');
const { validate } = require('../middleware/validate');
const { loadStoreRole, requireStoreRole } = require('../middleware/commerceAccess');
const { createCategorySchema, updateCategorySchema, reorderCategoriesSchema } = require('../validators/categorySchemas');

const { adminOnlyOnMarketplace } = require('../middleware/marketplaceGuard');

const router = Router({ mergeParams: true });

router.get('/', loadStoreRole, ctrl.listCategories);
router.post('/', loadStoreRole, adminOnlyOnMarketplace, requireStoreRole('content_editor'), validate(createCategorySchema), ctrl.createCategory);
router.post('/reorder', loadStoreRole, adminOnlyOnMarketplace, requireStoreRole('content_editor'), validate(reorderCategoriesSchema), ctrl.reorderCategories);
router.patch('/:categoryId', loadStoreRole, adminOnlyOnMarketplace, requireStoreRole('content_editor'), validate(updateCategorySchema), ctrl.updateCategory);
router.delete('/:categoryId', loadStoreRole, adminOnlyOnMarketplace, requireStoreRole('commerce_manager'), ctrl.deleteCategory);

module.exports = router;
