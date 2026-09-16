'use strict';
// Clearance Stage Ledger routes (Clearance Compression, Phase 0).
// Mounted at /v1/clearance_ledger. /model is public (it is the promise we quote
// and should be auditable); everything else needs a gateway identity, with
// tenant scoping in the controller + RLS at the DB.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/clearanceLedgerController');

// Static routes FIRST so they are not shadowed by '/:subject_type/:subject_id'.
router.get('/model',       ctrl.getModel);
router.get('/bottlenecks', authMiddleware, ctrl.getBottlenecks);

router.get('/:subject_type/:subject_id',       authMiddleware, ctrl.getTimeline);
router.post('/:subject_type/:subject_id/plan', authMiddleware, ctrl.planStages);
router.post('/:subject_type/:subject_id/stages/:stage/:action', authMiddleware, ctrl.transition);

module.exports = router;
