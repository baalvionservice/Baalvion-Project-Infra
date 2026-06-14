'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/performanceController');

// Institutional performance snapshot (single-tenant, public read; admin write).
router.get('/metrics', ctrl.metrics);
router.put('/metrics', authMiddleware, ctrl.update);

module.exports = router;
