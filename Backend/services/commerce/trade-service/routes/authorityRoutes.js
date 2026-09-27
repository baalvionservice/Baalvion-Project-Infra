'use strict';
// Delegated authority routes (Compression, Phase 7).
// Mounted at /v1/authority. /policy is public: a customer should be able to see
// which decisions the platform will refuse to automate, and why.
const router = require('express').Router();
const { authMiddleware, requireOrgType } = require('../middleware/authMiddleware');
const ctrl = require('../controller/authorityController');

router.get('/policy',   ctrl.getPolicy);
router.get('/coverage', authMiddleware, ctrl.coverage);
router.get('/impact',   authMiddleware, ctrl.impact);
router.get('/queue',    authMiddleware, ctrl.queue);

// Delegating authority and issuing/resolving a regulatory decision are the regulator's own acts.
router.get('/delegations',  authMiddleware, ctrl.listDelegations);
router.post('/delegations', authMiddleware, requireOrgType('regulator'), ctrl.upsertDelegation);

router.post('/decide',              authMiddleware, requireOrgType('regulator'), ctrl.decide);
router.post('/decisions/:id/resolve', authMiddleware, requireOrgType('regulator'), ctrl.resolveDecision);

module.exports = router;
