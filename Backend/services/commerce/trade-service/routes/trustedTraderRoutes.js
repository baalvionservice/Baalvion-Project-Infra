'use strict';
// Trusted trader routes (Compression, Phase 6).
// Mounted at /v1/trusted_trader. The programme catalogue and the channel model
// are public: which accreditation is worth pursuing is a decision a prospect
// should be able to make before signing up.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/trustedTraderController');

// Static routes FIRST so they are not shadowed by '/:org_id/...'.
router.get('/programmes',  ctrl.getProgrammes);
router.get('/channels',    ctrl.getChannels);
router.post('/recommend',  authMiddleware, ctrl.recommend);
router.post('/assess',     authMiddleware, ctrl.assess);

router.get('/:org_id/readiness',        authMiddleware, ctrl.readiness);
router.get('/:org_id/accreditations',   authMiddleware, ctrl.listAccreditations);
router.post('/:org_id/accreditations',  authMiddleware, ctrl.upsertAccreditation);
router.post('/:org_id/recompute',       authMiddleware, ctrl.recompute);
router.post('/:org_id/selection_risk',  authMiddleware, ctrl.selectionRisk);
router.post('/:org_id/examinations',    authMiddleware, ctrl.recordExamination);

module.exports = router;
