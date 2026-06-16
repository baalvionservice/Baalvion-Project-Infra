'use strict';
const { Router } = require('express');
const ctrl = require('../controller/fxRatesController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.get);
router.post('/refresh', authMiddleware, ctrl.refresh);

module.exports = router;
