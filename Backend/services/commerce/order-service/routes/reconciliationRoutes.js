'use strict';
const { Router } = require('express');
const ctrl = require('../controller/reconciliationController');
const { loadStoreRole, requireStoreRole } = require('../middleware/rbacPep');

const router = Router({ mergeParams: true });

// Financial reconciliation is store-financial data → require an elevated store role.
router.get('/', loadStoreRole, requireStoreRole('ops_manager'), ctrl.report);
router.post('/backfill', loadStoreRole, requireStoreRole('store_admin'), ctrl.backfill);

module.exports = router;
