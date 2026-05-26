'use strict';
const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const ctrl = require('../controller/queueController');

router.get('/health',                authMiddleware, ctrl.health);
router.post('/dead-letter/replay',   authMiddleware, requireRole('admin', 'operator'), ctrl.replay);
router.patch('/:name/pause',         authMiddleware, requireRole('admin', 'operator'), ctrl.pause);
router.patch('/:name/resume',        authMiddleware, requireRole('admin', 'operator'), ctrl.resume);
router.post('/notifications/dispatch', authMiddleware, ctrl.dispatchNotification);

module.exports = router;
