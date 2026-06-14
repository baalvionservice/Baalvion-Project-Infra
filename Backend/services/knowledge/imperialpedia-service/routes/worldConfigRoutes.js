'use strict';
const router = require('express').Router();
const ctrl = require('../controller/worldConfigController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public read — the World page consumes this.
router.get('/', ctrl.getConfig);

// Admin write — from the admin-platform "World Control" panel.
router.put('/', authMiddleware, ctrl.updateConfig);

module.exports = router;
