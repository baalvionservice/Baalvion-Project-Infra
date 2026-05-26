'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/notificationController');

router.get('/',              authMiddleware, ctrl.listNotifications);
router.post('/read-all',     authMiddleware, ctrl.markAllRead);
router.patch('/:id/read',    authMiddleware, ctrl.markRead);
router.delete('/:id',        authMiddleware, ctrl.deleteNotification);

module.exports = router;
