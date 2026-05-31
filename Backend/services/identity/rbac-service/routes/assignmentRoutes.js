'use strict';
const express = require('express');
const ctrl = require('../controllers/assignmentController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/authMiddleware');
const { requireScopeAdmin } = require('../middleware/guards');
const { validate } = require('../validators/schemas');
const roleService = require('../services/roleService');
const assignmentService = require('../services/assignmentService');
const db = require('../models');

const router = express.Router();

// Granting a role is authorized against the SCOPE the grant targets.
const scopeOfAssign = async (req) => {
    const role = await roleService.getRole(req.body.roleId);
    let scopeId = req.body.scopeId;
    if (!scopeId && role.scope_type !== 'platform') {
        const t = await db.Tenant.findByPk(role.tenant_id);
        scopeId = t?.external_ref;
    }
    return { scopeType: role.scope_type, scopeId: scopeId || '*' };
};

const scopeOfAssignmentParam = async (req) => {
    const a = await db.RoleAssignment.findByPk(req.params.id);
    if (!a) return { scopeType: 'platform', scopeId: '*' };
    return { scopeType: a.scope_type, scopeId: a.scope_id };
};

router.get('/', authenticate, asyncHandler(ctrl.list));
router.post('/', authenticate, validate('assignRole'), requireScopeAdmin(scopeOfAssign), asyncHandler(ctrl.create));
router.delete('/:id', authenticate, requireScopeAdmin(scopeOfAssignmentParam), asyncHandler(ctrl.revoke));

module.exports = router;
