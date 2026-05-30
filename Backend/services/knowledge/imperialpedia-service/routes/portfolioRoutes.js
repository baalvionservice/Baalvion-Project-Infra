'use strict';
const router = require('express').Router();
const ctrl = require('../controller/portfolioController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All per-user; req.user.id from the verified token.
router.get('/watchlist', authMiddleware, ctrl.getWatchlist);
router.post('/watchlist', authMiddleware, ctrl.addWatchlist);
router.delete('/watchlist/:symbol', authMiddleware, ctrl.removeWatchlist);

router.get('/', authMiddleware, ctrl.getPortfolio);
router.post('/holdings', authMiddleware, ctrl.upsertHolding);
router.delete('/holdings/:symbol', authMiddleware, ctrl.removeHolding);

module.exports = router;
