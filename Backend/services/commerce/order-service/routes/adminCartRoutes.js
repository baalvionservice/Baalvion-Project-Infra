'use strict';
// Platform-scoped (cross-store) cart visibility — "admin can see exactly what/who/when a user is
// dropping in their cart." Mounted at /orders/admin/carts (NOT under /orders/stores/:storeId),
// same convention as platformAnalyticsRoutes.js: gated by requirePlatformAdmin (super_admin |
// country_admin) since the store-scoped PEP is the wrong authority for an all-stores query.
const { Router } = require('express');
const ctrl = require('../controller/adminCartController');
const { validateQuery } = require('../middleware/validate');
const { requirePlatformAdmin } = require('../middleware/rbacPep');
const { adminListCartsQuerySchema, adminListAbandonedCartsQuerySchema, adminCartHistoryQuerySchema } = require('../validators/cartSchemas');

const router = Router();

router.get('/', requirePlatformAdmin, validateQuery(adminListCartsQuerySchema), ctrl.listLiveCarts);
router.get('/abandoned', requirePlatformAdmin, validateQuery(adminListAbandonedCartsQuerySchema), ctrl.listAbandonedCarts);
router.get('/users/:userId/history', requirePlatformAdmin, validateQuery(adminCartHistoryQuerySchema), ctrl.getCartHistory);

module.exports = router;
