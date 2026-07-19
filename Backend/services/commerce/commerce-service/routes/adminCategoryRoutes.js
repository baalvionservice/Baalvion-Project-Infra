'use strict';
// Platform-scoped (cross-store) category administration. Mounted at /commerce/admin/categories —
// OUTSIDE the /commerce/stores/:storeId tree, mirroring order-service's
// routes/platformAnalyticsRoutes.js mounting pattern exactly (a literal path, not nested under
// :storeId, gated by requirePlatformAdmin instead of the store-scoped PEP).
const { Router } = require('express');
const ctrl = require('../controller/adminCategoryController');
const { validate, validateQuery } = require('../middleware/validate');
const { requirePlatformAdmin } = require('../middleware/commerceAccess');
const {
    adminCreateCategorySchema,
    adminUpdateCategorySchema,
    adminReorderCategoriesSchema,
    adminListCategoriesQuerySchema,
    adminDeleteCategoryQuerySchema,
} = require('../validators/categorySchemas');

const router = Router();

router.get('/', requirePlatformAdmin, validateQuery(adminListCategoriesQuerySchema), ctrl.listCategories);
router.post('/', requirePlatformAdmin, validate(adminCreateCategorySchema), ctrl.createCategory);
router.post('/reorder', requirePlatformAdmin, validate(adminReorderCategoriesSchema), ctrl.reorderCategories);
router.patch('/:categoryId', requirePlatformAdmin, validate(adminUpdateCategorySchema), ctrl.updateCategory);
router.delete('/:categoryId', requirePlatformAdmin, validateQuery(adminDeleteCategoryQuerySchema), ctrl.deleteCategory);

module.exports = router;
