'use strict';
const { Router } = require('express');
const ctrl = require('../controller/transactionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.listTransactions);

module.exports = router;
