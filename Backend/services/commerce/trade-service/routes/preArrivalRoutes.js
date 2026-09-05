'use strict';
// Pre-arrival filing routes (Compression, Phase 4).
// Mounted at /v1/prearrival. /regimes is public — which deadline runs from lading
// rather than arrival is the detail shippers most often get wrong and get fined
// for, and it should not sit behind a login.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/preArrivalController');

// Static routes FIRST so they are not shadowed by '/:consignment_id/...'.
router.get('/regimes',   ctrl.getRegimes);
router.get('/sweep',     authMiddleware, ctrl.sweep);
router.get('/exposure',  authMiddleware, ctrl.exposure);
router.post('/plan',     authMiddleware, ctrl.planFor);

router.post('/filings/:id/filed',  authMiddleware, ctrl.markFiled);
router.post('/filings/:id/failed', authMiddleware, ctrl.markFailed);

router.post('/:consignment_id/schedule', authMiddleware, ctrl.schedule);

module.exports = router;
