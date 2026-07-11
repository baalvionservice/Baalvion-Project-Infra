'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/messageController');

router.get('/',              authMiddleware, ctrl.listMessages);
router.get('/unread-count',  authMiddleware, ctrl.unreadCount);
router.post('/',             authMiddleware, ctrl.sendMessage);
router.patch('/:id/read',    authMiddleware, ctrl.markRead);

module.exports = router;
