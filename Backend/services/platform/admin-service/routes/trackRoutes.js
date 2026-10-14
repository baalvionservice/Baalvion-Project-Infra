'use strict';
const router = require('express').Router();
const ctrl   = require('../controller/trackController');
const rateLimit = require('express-rate-limit');
const { authMiddleware, requireStaffAdmin } = require('../middleware/authMiddleware');

// One visitor loads a few pages a minute at most; this keeps the open endpoint from being used to fill the table.
const postLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

// Public — anyone can post their tracking data
router.post('/visitor', postLimiter, ctrl.trackVisitor);

// Admin-only — read visitor list
router.get('/visitors', authMiddleware, requireStaffAdmin, ctrl.getVisitors);

module.exports = router;
