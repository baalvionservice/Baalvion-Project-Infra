'use strict';
const { Router } = require('express');
const ctrl = require('../controller/financialController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/calculate', authMiddleware, ctrl.calculateProfit);
router.get('/summary', authMiddleware, ctrl.getProfitSummary);

module.exports = router;
