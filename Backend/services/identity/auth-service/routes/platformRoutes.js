const express = require('express');
const ctrl = require('../controller/platformController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// All platform routes require auth; platform-owner authority is enforced per-handler
// (platformService.assertPlatformAuthority) so the check is independent of the JWT role claim.
router.use(authMiddleware);

router.get('/platform/metrics', ctrl.getMetrics);
router.get('/platform/organizations', ctrl.listOrganizations);
router.post('/platform/organizations', ctrl.createOrganization);
router.get('/platform/organizations/:orgId', ctrl.getOrganization);
router.patch('/platform/organizations/:orgId', ctrl.updateOrganization);
router.post('/platform/organizations/:orgId/status', ctrl.setOrganizationStatus);
router.get('/platform/organizations/:orgId/users', ctrl.listOrganizationUsers);
router.get('/platform/organizations/:orgId/audit', ctrl.getOrganizationAudit);

module.exports = router;
