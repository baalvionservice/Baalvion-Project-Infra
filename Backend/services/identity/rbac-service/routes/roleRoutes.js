'use strict';
const express = require('express');
const ctrl = require('../controllers/roleController');
const permCtrl = require('../controllers/permissionController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/authMiddleware');
const { requireTenantAdmin, tenantOfRoleParam } = require('../middleware/guards');
const { validate } = require('../validators/schemas');
const roleService = require('../services/roleService');

const router = express.Router();

const tenantFromBody = (req) => req.body.tenantId;
const tenantOfRoleId = async (req) => (await roleService.getRole(req.params.roleId)).tenant_id;

// ── Roles ──────────────────────────────────────────────────────────────────────
router.get('/', authenticate, asyncHandler(ctrl.list));
router.get('/hierarchy', authenticate, asyncHandler(ctrl.hierarchy));
router.get('/:id', authenticate, asyncHandler(ctrl.get));
router.post('/', authenticate, validate('createRole'), requireTenantAdmin(tenantFromBody), asyncHandler(ctrl.create));
router.patch('/:id', authenticate, validate('updateRole'), requireTenantAdmin(tenantOfRoleParam), asyncHandler(ctrl.update));
router.delete('/:id', authenticate, requireTenantAdmin(tenantOfRoleParam), asyncHandler(ctrl.remove));
router.put('/:id/parent', authenticate, validate('setParent'), requireTenantAdmin(tenantOfRoleParam), asyncHandler(ctrl.setParent));

// ── Role ⇄ Permission (Phase 2) ──────────────────────────────────────────────────
router.get('/:roleId/permissions', authenticate, asyncHandler(permCtrl.listForRole));
router.get('/:roleId/permissions/effective', authenticate, asyncHandler(permCtrl.effectiveForRole));
router.post('/:roleId/permissions', authenticate, validate('attachPermission'), requireTenantAdmin(tenantOfRoleId), asyncHandler(permCtrl.attach));
router.delete('/:roleId/permissions/:permissionId', authenticate, requireTenantAdmin(tenantOfRoleId), asyncHandler(permCtrl.detach));

module.exports = router;
