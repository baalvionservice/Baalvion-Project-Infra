'use strict';
// Shipment Tracking & Global Visibility Platform — dashboard KPI/map/alert aggregates.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const c = require('../controller/logisticsTrackingDashboardController');

router.get('/summary',             authMiddleware, c.summary);
router.get('/carrier_performance', authMiddleware, c.carrierPerformance);
router.get('/map_overview',        authMiddleware, c.mapOverview);
router.get('/recent_events',       authMiddleware, c.recentEvents);
router.get('/alerts',              authMiddleware, c.alerts);

module.exports = router;
