'use strict';
// Platform Management console routes. Mount: /v1/admin/platforms, registered in v1.js
// BEFORE the generic '/admin' mount (same reason as feature-flags/analytics — otherwise
// Express routes /admin/platforms into adminRoutes and 404s).
const router = require('express').Router();
const ctrl   = require('../controller/platformController');
const { requireStaffAdmin } = require('../middleware/authMiddleware');

// Platform-staff tier: EXACT match on admin/super_admin, NOT hierarchical. `owner` is a
// self-service role (registration makes every user owner of their own org), so a
// hierarchical admin gate handed these surfaces to the entire public.
router.use(requireStaffAdmin);

router.get('/',         ctrl.listPlatforms);
router.get('/revenue',  ctrl.getRevenueRollup);

module.exports = router;
