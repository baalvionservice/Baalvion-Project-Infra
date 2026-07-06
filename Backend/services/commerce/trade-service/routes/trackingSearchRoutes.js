'use strict';
// Shipment Tracking & Global Visibility Platform — cross-entity tracking search.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/trackingSearchController');

router.get('/', authMiddleware, requirePermission(LOGISTICS_PERMISSIONS.TRACKING_SEARCH), c.search);

module.exports = router;
