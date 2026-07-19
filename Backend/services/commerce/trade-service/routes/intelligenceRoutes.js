'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { calibrateForecast, executeStrategicOptimization } = require('../controller/intelligenceController');

router.post('/corridor-forecast', authMiddleware, calibrateForecast);
router.post('/strategic-optimization', authMiddleware, executeStrategicOptimization);

module.exports = router;
