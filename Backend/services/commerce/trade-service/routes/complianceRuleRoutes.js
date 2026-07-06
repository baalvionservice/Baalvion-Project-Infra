'use strict';
// Compliance Engine — mounted at /v1/compliance_rules (Phase 2, Step 10).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/complianceRuleController');

router.get('/', authMiddleware, ctrl.listRules);
router.post('/', authMiddleware, ctrl.createRule);
router.patch('/:id', authMiddleware, ctrl.updateRule);
router.post('/evaluate', authMiddleware, ctrl.evaluateOrg);
router.get('/evaluations', authMiddleware, ctrl.getEvaluations);

module.exports = router;
