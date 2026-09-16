'use strict';
// Clearance gate routes (Compression, Phase 3).
// Mounted at /v1/clearance_gates. /definition is public — the conditions that can
// block a shipment should be readable without an account. Everything else needs a
// gateway identity, with tenant scoping in the controller + RLS at the DB.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/clearanceGateController');

router.get('/definition', ctrl.getDefinition);

router.get('/:consignment_id',                    authMiddleware, ctrl.getStatus);
router.post('/:consignment_id/advance',           authMiddleware, ctrl.advance);
router.post('/:consignment_id/evaluate/:gate',    authMiddleware, ctrl.evaluateOne);

module.exports = router;
