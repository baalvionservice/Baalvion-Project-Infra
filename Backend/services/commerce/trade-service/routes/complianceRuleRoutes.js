'use strict';
// Compliance Engine — mounted at /v1/compliance_rules (Phase 2, Step 10).
const router = require('express').Router();
const { authMiddleware, requireOrgType } = require('../middleware/authMiddleware');
const ctrl = require('../controller/complianceRuleController');

// The rule catalog itself is the compliance agency's own policy configuration.
router.get('/', authMiddleware, ctrl.listRules);
router.post('/', authMiddleware, requireOrgType('compliance_agency'), ctrl.createRule);
router.patch('/:id', authMiddleware, requireOrgType('compliance_agency'), ctrl.updateRule);
router.post('/evaluate', authMiddleware, ctrl.evaluateOrg);
router.get('/evaluations', authMiddleware, ctrl.getEvaluations);

module.exports = router;
