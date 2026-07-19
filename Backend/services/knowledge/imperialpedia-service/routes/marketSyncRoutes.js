'use strict';
const router = require('express').Router();
const ctrl = require('../controller/marketSyncController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/sync-status', authMiddleware, ctrl.getSyncStatus);
router.post('/resync', authMiddleware, ctrl.triggerResync);

module.exports = router;
