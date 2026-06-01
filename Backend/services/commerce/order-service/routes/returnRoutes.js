'use strict';
const { Router } = require('express');
const ctrl = require('../controller/returnController');
const { validate } = require('../middleware/validate');
const { loadStoreRole, requireStoreRole } = require('../middleware/rbacPep');
const { createReturnSchema, updateReturnStatusSchema } = require('../validators/orderSchemas');

const router = Router({ mergeParams: true });

// Admin: listing all returns (cross-tenant) and processing them (approve/refund) require a role.
router.get('/', loadStoreRole, requireStoreRole('store_viewer'), ctrl.listReturns);
router.patch('/:returnId/status', loadStoreRole, requireStoreRole('ops_manager'), validate(updateReturnStatusSchema), ctrl.updateReturnStatus);
// Shopper: requesting a return is customer-initiated (NOT store-role gated).
router.post('/', validate(createReturnSchema), ctrl.createReturn);

module.exports = router;
