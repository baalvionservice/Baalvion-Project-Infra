'use strict';
const express = require('express');
const ctrl = require('../controllers/permissionController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/authMiddleware');
const { requireSuperAdmin } = require('../middleware/guards');
const { validate } = require('../validators/schemas');

const router = express.Router();

// The permission registry is a platform-global catalogue → super_admin curated.
router.get('/', authenticate, asyncHandler(ctrl.list));
router.post('/', authenticate, validate('createPermission'), requireSuperAdmin, asyncHandler(ctrl.create));
router.delete('/:id', authenticate, requireSuperAdmin, asyncHandler(ctrl.remove));

module.exports = router;
