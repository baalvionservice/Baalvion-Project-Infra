'use strict';
const express = require('express');
const ctrl = require('../controllers/tenantController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/authMiddleware');
const { requireTenantAdmin } = require('../middleware/guards');
const { validate } = require('../validators/schemas');
const tenantService = require('../services/tenantService');

const router = express.Router();

// Creating a tenant is authorized against its PARENT (country⇒platform=super only;
// organization⇒its country, which a country_admin governs).
const parentTenantId = async (req) => {
    if (req.body.parentId) return req.body.parentId;
    const platform = await tenantService.getPlatformTenant();
    return platform ? platform.id : null;
};

router.get('/', authenticate, asyncHandler(ctrl.list));
router.get('/:id', authenticate, asyncHandler(ctrl.get));
router.post('/', authenticate, validate('createTenant'), requireTenantAdmin(parentTenantId), asyncHandler(ctrl.create));

module.exports = router;
