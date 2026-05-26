'use strict';
const { Router } = require('express');
const ctrl = require('../controller/crmController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.post('/run', authMiddleware, ctrl.runScoring);
router.get('/top-leads', authMiddleware, ctrl.topLeads);
router.get('/insights', authMiddleware, ctrl.scoringInsights);

module.exports = router;
