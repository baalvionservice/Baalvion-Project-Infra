'use strict';
const { Router } = require('express');
const ctrl = require('../controller/automationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/rules', authMiddleware, ctrl.listRules);
router.post('/trigger', authMiddleware, ctrl.triggerEvent);

module.exports = router;
