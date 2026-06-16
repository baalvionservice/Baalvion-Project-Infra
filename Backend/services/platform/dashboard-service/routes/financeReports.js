'use strict';
const { Router } = require('express');
const ctrl = require('../controller/financeReportsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.get);
router.post('/', authMiddleware, ctrl.create);

module.exports = router;
