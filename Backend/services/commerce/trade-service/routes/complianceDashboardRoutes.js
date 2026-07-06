'use strict';
// Compliance Dashboard — mounted at /v1/compliance_dashboard (Phase 2, Step 16).
// Admin/reviewer-only.
const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const ctrl = require('../controller/complianceDashboardController');

router.use(authMiddleware);
router.use(requireRole('admin', 'operator', 'reviewer'));

router.get('/', ctrl.getDashboard);

module.exports = router;
