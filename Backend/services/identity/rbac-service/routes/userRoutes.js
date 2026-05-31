'use strict';
const express = require('express');
const assignmentCtrl = require('../controllers/assignmentController');
const policyCtrl = require('../controllers/policyController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/authMiddleware');
const { requireTenantAdmin } = require('../middleware/guards');
const { validate } = require('../validators/schemas');
const tenantService = require('../services/tenantService');

const router = express.Router();

// Setting subject attributes is admin-scoped: tenant-bound attrs need that tenant's
// admin; global attrs (no tenantId) resolve to platform ⇒ super_admin.
const tenantOfAttr = async (req) => {
    if (req.body.tenantId) return req.body.tenantId;
    const platform = await tenantService.getPlatformTenant();
    return platform ? platform.id : null;
};

router.get('/:userId/roles', authenticate, asyncHandler(assignmentCtrl.userRoles));
router.get('/:userId/effective', authenticate, asyncHandler(assignmentCtrl.userEffective));
router.get('/:userId/attributes', authenticate, asyncHandler(policyCtrl.getAttributes));
router.put('/:userId/attributes', authenticate, validate('setSubjectAttribute'), requireTenantAdmin(tenantOfAttr), asyncHandler(policyCtrl.setAttribute));

module.exports = router;
