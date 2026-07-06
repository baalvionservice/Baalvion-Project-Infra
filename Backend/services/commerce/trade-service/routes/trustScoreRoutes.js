'use strict';
// Trust Score Engine — mounted at /v1/trust_scores (Phase 2, Step 13).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/trustScoreController');

router.get('/', authMiddleware, ctrl.getCurrentTrustScore);
router.get('/history', authMiddleware, ctrl.listTrustScoreHistory);
router.post('/compute', authMiddleware, ctrl.computeTrustScore);

module.exports = router;
