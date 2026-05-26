'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/metricController');

router.get('/snapshot', authMiddleware, ctrl.getSnapshots);
router.post('/', authMiddleware, ctrl.pushMetric);

module.exports = router;
