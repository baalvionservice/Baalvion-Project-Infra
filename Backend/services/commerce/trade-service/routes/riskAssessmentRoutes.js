'use strict';
// Risk Assessment Engine — mounted at /v1/risk_assessments (Phase 2, Step 12).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/riskAssessmentController');

router.get('/', authMiddleware, ctrl.getCurrentRiskAssessment);
router.get('/history', authMiddleware, ctrl.listRiskHistory);
router.post('/compute', authMiddleware, ctrl.computeRiskAssessment);

module.exports = router;
