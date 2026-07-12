'use strict';
// Platform Management console routes. Mount: /v1/admin/platforms, registered in v1.js
// BEFORE the generic '/admin' mount (same reason as feature-flags/analytics — otherwise
// Express routes /admin/platforms into adminRoutes and 404s).
const router = require('express').Router();
const ctrl   = require('../controller/platformController');
const { requireSuperAdmin } = require('../middleware/authMiddleware');

router.use(requireSuperAdmin);

router.get('/',         ctrl.listPlatforms);
router.get('/revenue',  ctrl.getRevenueRollup);

module.exports = router;
