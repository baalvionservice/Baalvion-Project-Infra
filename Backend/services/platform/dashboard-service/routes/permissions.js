'use strict';
const { Router } = require('express');
const ctrl = require('../controller/permissionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/matrix', authMiddleware, ctrl.getPermissionMatrix);
router.get('/:user_id', authMiddleware, ctrl.getUserPermissions);
router.post('/assign', authMiddleware, ctrl.assignPermission);

module.exports = router;
