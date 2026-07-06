'use strict';
// Reputation System — mounted at /v1/reputation_ratings + /v1/reputation_summaries
// (Phase 2, Step 14).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/reputationController');

router.get('/ratings', authMiddleware, ctrl.listRatings);
router.post('/ratings', authMiddleware, ctrl.submitRating);
router.get('/summaries', authMiddleware, ctrl.getSummaries);

module.exports = router;
