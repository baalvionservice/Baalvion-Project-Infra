'use strict';
const { Router } = require('express');
const ctrl = require('../controller/automationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.get);
router.post('/jobs/:jobKey/run', authMiddleware, ctrl.runJob);

module.exports = router;
