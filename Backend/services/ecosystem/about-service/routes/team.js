'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/teamController');

router.get('/', ctrl.listTeamMembers);
router.post('/', authMiddleware, ctrl.createTeamMember);
router.get('/:id', ctrl.getTeamMember);
router.patch('/:id', authMiddleware, ctrl.updateTeamMember);
router.delete('/:id', authMiddleware, ctrl.deleteTeamMember);

module.exports = router;
