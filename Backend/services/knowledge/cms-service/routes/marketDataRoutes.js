'use strict';
const { Router } = require('express');
const ctrl = require('../controller/marketDataController');

const router = Router();

// GET /cms/market-data/overview — indices, stocks, crypto, forex, commodities, bonds
router.get('/overview', ctrl.getOverview);

// GET /cms/market-data/quote/:symbol?range=1D|5D|1M|1Y&websiteId= — DB-driven via market_assets
router.get('/quote/:symbol', ctrl.getQuote);

module.exports = router;
