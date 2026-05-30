'use strict';
const { Router } = require('express');
const ctrl = require('../controller/analyticsController');

const router = Router({ mergeParams: true });

router.get('/summary', ctrl.summary);
router.get('/top-products', ctrl.topProducts);
router.get('/by-country', ctrl.salesByCountry);
router.get('/revenue', ctrl.revenueTimeSeries);

module.exports = router;
