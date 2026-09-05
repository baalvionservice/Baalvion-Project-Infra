'use strict';
// Delegated authority routes (Compression, Phase 7).
// Mounted at /v1/authority. /policy is public: a customer should be able to see
// which decisions the platform will refuse to automate, and why.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/authorityController');

router.get('/policy',   ctrl.getPolicy);
router.get('/coverage', authMiddleware, ctrl.coverage);
router.get('/impact',   authMiddleware, ctrl.impact);
router.get('/queue',    authMiddleware, ctrl.queue);

router.get('/delegations',  authMiddleware, ctrl.listDelegations);
router.post('/delegations', authMiddleware, ctrl.upsertDelegation);

router.post('/decide',              authMiddleware, ctrl.decide);
router.post('/decisions/:id/resolve', authMiddleware, ctrl.resolveDecision);

module.exports = router;
