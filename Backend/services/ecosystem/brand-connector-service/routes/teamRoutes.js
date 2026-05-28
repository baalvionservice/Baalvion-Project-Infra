'use strict';
const { Router } = require('express');
const ctrl = require('../controller/teamController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.listTeam);
router.post('/invite', authMiddleware, ctrl.inviteMember);
router.get('/permissions', authMiddleware, ctrl.getPermissions);
router.patch('/:id/role', authMiddleware, ctrl.changeRole);
router.delete('/:id', authMiddleware, ctrl.removeMember);

module.exports = router;
