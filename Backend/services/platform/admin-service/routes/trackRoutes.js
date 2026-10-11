'use strict';
const router = require('express').Router();
const ctrl   = require('../controller/trackController');
const { requireStaffAdmin } = require('../middleware/authMiddleware');

// Public — anyone can post their tracking data
router.post('/visitor', ctrl.trackVisitor);

// Admin-only — read visitor list
router.get('/visitors', requireStaffAdmin, ctrl.getVisitors);

module.exports = router;
