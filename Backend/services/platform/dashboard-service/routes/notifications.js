'use strict';
const { Router } = require('express');
const ctrl = require('../controller/notificationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.listNotifications);
router.post('/', authMiddleware, ctrl.createNotification);
router.patch('/:id/read', authMiddleware, ctrl.markAsRead);

module.exports = router;
