'use strict';
const express = require('express');
const ctrl = require('../controllers/policyController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/authMiddleware');
const { requireTenantAdmin } = require('../middleware/guards');
const { validate } = require('../validators/schemas');
const policyService = require('../services/policyService');
const tenantService = require('../services/tenantService');

const router = express.Router();

// A tenant policy is governed by that tenant's admin; a GLOBAL policy (no tenantId)
// resolves to the platform tenant ⇒ super_admin only.
const tenantOfBody = async (req) => req.body.tenantId || (await tenantService.getPlatformTenant())?.id;
const tenantOfPolicyParam = async (req) => {
    const p = await policyService.getPolicy(req.params.id);
    return p.tenant_id || (await tenantService.getPlatformTenant())?.id;
};

router.get('/', authenticate, asyncHandler(ctrl.list));
router.get('/:id', authenticate, asyncHandler(ctrl.get));
router.post('/', authenticate, validate('createPolicy'), requireTenantAdmin(tenantOfBody), asyncHandler(ctrl.create));
router.patch('/:id', authenticate, validate('updatePolicy'), requireTenantAdmin(tenantOfPolicyParam), asyncHandler(ctrl.update));
router.delete('/:id', authenticate, requireTenantAdmin(tenantOfPolicyParam), asyncHandler(ctrl.remove));

module.exports = router;
