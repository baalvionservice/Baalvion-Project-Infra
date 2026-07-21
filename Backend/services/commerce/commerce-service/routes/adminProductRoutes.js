'use strict';
// Platform-scoped (cross-store) product oversight. Mounted at /commerce/admin/products —
// mirrors adminCategoryRoutes.js's mounting convention exactly.
const { Router } = require('express');
const ctrl = require('../controller/adminProductController');
const { validate, validateQuery } = require('../middleware/validate');
const { requirePlatformAdmin } = require('../middleware/commerceAccess');
const { adminListProductsQuerySchema, moderateProductSchema } = require('../validators/productSchemas');

const router = Router();

router.get('/', requirePlatformAdmin, validateQuery(adminListProductsQuerySchema), ctrl.listProducts);
router.get('/pending', requirePlatformAdmin, validateQuery(adminListProductsQuerySchema), ctrl.listPending);
router.patch('/:productId/moderate', requirePlatformAdmin, validate(moderateProductSchema), ctrl.moderate);

module.exports = router;
