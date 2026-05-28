'use strict';
const router = require('express').Router();
const ctrl = require('../controller/assetsController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', ctrl.listAssets);
router.post('/', authMiddleware, ctrl.upsertAsset);
router.get('/:symbol/summary', ctrl.getAssetSummary);
router.get('/:symbol', ctrl.getAsset);

module.exports = router;
