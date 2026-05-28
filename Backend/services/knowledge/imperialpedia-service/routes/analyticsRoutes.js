'use strict';
const router = require('express').Router();
const ctrl = require('../controller/analyticsController');

router.get('/content', ctrl.getContentAnalytics);
router.get('/community', ctrl.getCommunityAnalytics);

module.exports = router;
