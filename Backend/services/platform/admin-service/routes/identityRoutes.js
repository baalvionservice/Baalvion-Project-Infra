'use strict';
// Identity domain admin endpoints consumed by the console's Security Operations Center.
// admin-service currently implements the audit-derived risk feed; the remaining
// /identity/* surfaces (roles, api-keys, jwks, sso, mfa, devices) are reserved for
// future expansion of the identity domain.
const router = require('express').Router();
const ctrl   = require('../controller/adminController');
const { requireStaffAdmin } = require('../middleware/authMiddleware');

// Platform-staff tier: EXACT match on admin/super_admin, NOT hierarchical. `owner` is a
// self-service role (registration makes every user owner of their own org), so a
// hierarchical admin gate handed these surfaces to the entire public.
router.use(requireStaffAdmin);

router.get('/risk-events',              ctrl.getRiskEvents);
router.post('/risk-events/:id/resolve', ctrl.resolveRiskEvent);

module.exports = router;
