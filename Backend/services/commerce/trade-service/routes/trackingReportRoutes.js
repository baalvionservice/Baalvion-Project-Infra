'use strict';
// Shipment Tracking & Global Visibility Platform — CSV/JSON tracking reports.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, LOGISTICS_PERMISSIONS } = require('../middleware/permissions');
const c = require('../controller/trackingReportController');

const exportPerm = requirePermission(LOGISTICS_PERMISSIONS.TRACKING_REPORT_EXPORT);

router.get('/delay',            authMiddleware, exportPerm, c.delayReport);
router.get('/carrier',          authMiddleware, exportPerm, c.carrierReport);
router.get('/geofence',         authMiddleware, exportPerm, c.geofenceReport);
router.get('/eta',              authMiddleware, exportPerm, c.etaReport);
router.get('/tracking_history', authMiddleware, exportPerm, c.trackingHistoryReport);

module.exports = router;
