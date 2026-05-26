'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/analyticsController');

router.get('/performance', authMiddleware, ctrl.getPerformance);

module.exports = router;
