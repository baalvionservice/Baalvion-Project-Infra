'use strict';
// Identity domain admin endpoints consumed by the console's Security Operations Center.
// admin-service currently implements the audit-derived risk feed; the remaining
// /identity/* surfaces (roles, api-keys, jwks, sso, mfa, devices) are reserved for
// future expansion of the identity domain.
const router = require('express').Router();
const ctrl   = require('../controller/adminController');
const { requireSuperAdmin } = require('../middleware/authMiddleware');

router.use(requireSuperAdmin);

router.get('/risk-events',              ctrl.getRiskEvents);
router.post('/risk-events/:id/resolve', ctrl.resolveRiskEvent);

module.exports = router;
