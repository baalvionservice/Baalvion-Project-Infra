'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');

const portfolioRoutes = require('./portfolios');
const watchlistRoutes = require('./watchlists');
const tradeRoutes = require('./trades');
const alertRoutes = require('./alerts');
const newsRoutes = require('./news');
const analyticsRoutes = require('./analytics');

router.use('/portfolios', portfolioRoutes);
router.use('/watchlists', watchlistRoutes);
router.use('/trades', tradeRoutes);
router.use('/alerts', alertRoutes);
router.use('/news', newsRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
