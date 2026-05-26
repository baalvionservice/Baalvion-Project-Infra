'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/analyticsController');

router.get('/trade', authMiddleware, ctrl.getTradeSummary);
router.get('/listings', authMiddleware, ctrl.getListingStats);
router.get('/volume', authMiddleware, ctrl.getMonthlyVolume);

module.exports = router;
