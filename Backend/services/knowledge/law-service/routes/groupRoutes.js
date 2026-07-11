'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/groupController');

router.get('/',                    ctrl.listGroups);
router.post('/',                   authMiddleware, ctrl.createGroup);
router.get('/:slugOrId',           ctrl.getGroup);
router.post('/:slugOrId/join',     authMiddleware, ctrl.joinGroup);
router.post('/:slugOrId/leave',    authMiddleware, ctrl.leaveGroup);
router.get('/:slugOrId/posts',     ctrl.listPosts);
router.post('/:slugOrId/posts',    authMiddleware, ctrl.createPost);

module.exports = router;
