'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/tradeController');

router.get('/', authMiddleware, ctrl.listTrades);
router.post('/', authMiddleware, ctrl.createTrade);
router.get('/:id', authMiddleware, ctrl.getTrade);

module.exports = router;
