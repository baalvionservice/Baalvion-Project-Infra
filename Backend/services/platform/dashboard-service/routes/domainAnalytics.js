'use strict';
const { Router } = require('express');
const ctrl = require('../controller/domainAnalyticsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.get);

module.exports = router;
