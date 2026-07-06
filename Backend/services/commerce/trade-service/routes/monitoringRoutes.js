'use strict';
// Continuous Monitoring — mounted at /v1/monitoring (Phase 2, Step 19). Admin-only.
const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const ctrl = require('../controller/monitoringController');

router.use(authMiddleware);
router.use(requireRole('admin', 'operator'));

router.post('/run', ctrl.runMonitoringCycle);

module.exports = router;
