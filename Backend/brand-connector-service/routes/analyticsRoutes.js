'use strict';
const { Router } = require('express');
const ctrl = require('../controller/analyticsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/overview', authMiddleware, ctrl.overviewAnalytics);
router.get('/campaign/:id', authMiddleware, ctrl.campaignAnalytics);
router.get('/creators/:campaignId', authMiddleware, ctrl.creatorAnalytics);

module.exports = router;
