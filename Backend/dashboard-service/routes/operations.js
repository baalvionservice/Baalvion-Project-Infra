'use strict';
const { Router } = require('express');
const ctrl = require('../controller/operationsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/alerts/rules', authMiddleware, ctrl.listAlertRules);
router.post('/alerts/rules', authMiddleware, ctrl.createAlertRule);
router.patch('/alerts/rules/:id', authMiddleware, ctrl.updateAlertRule);
router.get('/alerts', authMiddleware, ctrl.listAlerts);
router.post('/alerts', authMiddleware, ctrl.createAlert);
router.patch('/alerts/:id', authMiddleware, ctrl.updateAlert);

module.exports = router;
