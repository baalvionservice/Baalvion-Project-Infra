'use strict';
const { Router } = require('express');
const ctrl = require('../controller/notificationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.listNotifications);
router.patch('/:id/read', authMiddleware, ctrl.markRead);

module.exports = router;
