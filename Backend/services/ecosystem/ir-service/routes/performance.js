'use strict';
const router = require('express').Router();
const ctrl = require('../controller/performanceController');

// Institutional performance snapshot (single-tenant, public read).
router.get('/metrics', ctrl.metrics);

module.exports = router;
