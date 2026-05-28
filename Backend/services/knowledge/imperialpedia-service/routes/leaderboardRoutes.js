'use strict';
const router = require('express').Router();
const ctrl = require('../controller/leaderboardController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', ctrl.getLeaderboard);
router.post('/refresh', authMiddleware, ctrl.refreshLeaderboard);

module.exports = router;
