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
// Every route is gated at the admin tier, exactly like adminRoutes.js.

const router = require('express').Router();
const ctrl   = require('../controller/analyticsController');
const { requireStaffAdmin } = require('../middleware/authMiddleware');

// Platform-staff tier: EXACT match on admin/super_admin, NOT hierarchical. `owner` is a
// self-service role (registration makes every user owner of their own org), so a
// hierarchical admin gate handed these surfaces to the entire public.
router.use(requireStaffAdmin);

router.get('/kpis',            ctrl.getKpis);
router.get('/users/growth',    ctrl.getUserGrowth);
router.get('/orgs/growth',     ctrl.getOrgGrowth);
router.get('/revenue',         ctrl.getRevenue);
router.get('/services/health', ctrl.getServiceHealth);
router.get('/activity',        ctrl.getRecentActivity);
router.get('/traffic',         ctrl.getTrafficByPage);
router.get('/funnel',          ctrl.getActivationFunnel);
router.get('/retention',       ctrl.getRetentionCohorts);
router.get('/signup-channels', ctrl.getSignupChannels);
router.get('/geography',       ctrl.getGeography);
router.get('/event-types',     ctrl.getEventTypeBreakdown);
router.get('/payment-funnel',  ctrl.getPaymentFunnel);

module.exports = router;
