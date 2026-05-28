'use strict';
const { Router } = require('express');
const ctrl = require('../controller/shareholderController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.post('/run', authMiddleware, ctrl.runDistribution);
router.get('/history', authMiddleware, ctrl.getDistributionHistory);

module.exports = router;
