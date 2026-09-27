'use strict';
// Clearance gate routes (Compression, Phase 3).
// Mounted at /v1/clearance_gates. /definition is public — the conditions that can
// block a shipment should be readable without an account. Everything else needs a
// gateway identity, with tenant scoping in the controller + RLS at the DB.
const router = require('express').Router();
const { authMiddleware, requireOrgType } = require('../middleware/authMiddleware');
const ctrl = require('../controller/clearanceGateController');

router.get('/definition', ctrl.getDefinition);

router.get('/:consignment_id',                    authMiddleware, ctrl.getStatus);
router.post('/:consignment_id/advance',           authMiddleware, ctrl.advance);
// Evaluating a clearance gate is the customs authority's own decision.
router.post('/:consignment_id/evaluate/:gate',    authMiddleware, requireOrgType('customs_authority'), ctrl.evaluateOne);

module.exports = router;
