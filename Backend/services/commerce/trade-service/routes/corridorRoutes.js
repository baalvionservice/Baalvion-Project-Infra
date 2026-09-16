'use strict';
// Corridor gate routes (Compression, Phase 2).
// Mounted at /v1/corridor. /matrix is public — a shipper is entitled to see why a
// document is required, and every rule carries its reason. Everything else needs
// a gateway identity, with tenant scoping in the controller + RLS at the DB.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/corridorController');

router.get('/matrix',              ctrl.getMatrix);
router.get('/first_pass_rate',     authMiddleware, ctrl.getFirstPassRate);

router.post('/requirements',       authMiddleware, ctrl.getRequirements);
router.post('/precheck',           authMiddleware, ctrl.runPrecheck);
router.post('/validate_container', authMiddleware, ctrl.validateContainer);

router.post('/prechecks/:id/reconcile', authMiddleware, ctrl.reconcile);

module.exports = router;
