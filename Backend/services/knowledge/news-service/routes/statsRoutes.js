'use strict';
const router = require('express').Router();
const ctrl = require('../controller/statsController');
const { apiKeyAuth } = require('../middleware/apiKeyAuth');
const { quota } = require('../middleware/quota');

router.get('/overview', apiKeyAuth, quota, ctrl.getOverview);

module.exports = router;
