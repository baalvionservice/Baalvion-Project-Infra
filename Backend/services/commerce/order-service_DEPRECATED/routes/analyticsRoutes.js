'use strict';
const { Router } = require('express');
const ctrl = require('../controller/analyticsController');
const { loadStoreRole, requireStoreRole } = require('../middleware/rbacPep');

const router = Router({ mergeParams: true });

// Analytics aggregate a store's commercial data — admin-only, RBAC store-scoped.
router.get('/summary', loadStoreRole, requireStoreRole('store_viewer'), ctrl.summary);
router.get('/top-products', loadStoreRole, requireStoreRole('store_viewer'), ctrl.topProducts);
router.get('/by-country', loadStoreRole, requireStoreRole('store_viewer'), ctrl.salesByCountry);
router.get('/revenue', loadStoreRole, requireStoreRole('store_viewer'), ctrl.revenueTimeSeries);

module.exports = router;
