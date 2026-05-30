'use strict';
const router = require('express').Router();
const ctrl = require('../controller/aiController');

router.get('/status', ctrl.status);
router.post('/asset-summary', ctrl.assetSummary);

module.exports = router;
