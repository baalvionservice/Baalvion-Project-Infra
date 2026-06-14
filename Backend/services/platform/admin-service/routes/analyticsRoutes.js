'use strict';
// admin-service :: analytics routes (READ-ONLY)
//
// Contract source of truth: Frontend/admin-platform/src/lib/api/analytics.ts, which
// calls /admin/analytics/* . This router is mounted by the integrator at
// '/admin/analytics' (see v1.js), so the paths below are RELATIVE to that root:
//
//   GET /admin/analytics/kpis              → kpis
//   GET /admin/analytics/users/growth      → userGrowth
//   GET /admin/analytics/orgs/growth       → orgGrowth
//   GET /admin/analytics/revenue           → revenue
//   GET /admin/analytics/services/health   → serviceHealth
//   GET /admin/analytics/activity          → recentActivity
//   GET /admin/analytics/traffic           → trafficByPage
//
// Every route is gated by requireSuperAdmin, exactly like adminRoutes.js.

const router = require('express').Router();
const ctrl   = require('../controller/analyticsController');
const { requireSuperAdmin } = require('../middleware/authMiddleware');

// All analytics routes require super_admin (mirrors adminRoutes.js).
router.use(requireSuperAdmin);

router.get('/kpis',            ctrl.getKpis);
router.get('/users/growth',    ctrl.getUserGrowth);
router.get('/orgs/growth',     ctrl.getOrgGrowth);
router.get('/revenue',         ctrl.getRevenue);
router.get('/services/health', ctrl.getServiceHealth);
router.get('/activity',        ctrl.getRecentActivity);
router.get('/traffic',         ctrl.getTrafficByPage);

module.exports = router;
