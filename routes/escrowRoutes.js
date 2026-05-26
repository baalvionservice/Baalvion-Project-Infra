'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
    listEscrows, getEscrow, createEscrow, fundEscrow, releaseEscrow, refundEscrow,
} = require('../controller/escrowController');

router.get('/',              authMiddleware, listEscrows);
router.get('/:id',           authMiddleware, getEscrow);
router.post('/',             authMiddleware, createEscrow);
router.patch('/:id/fund',    authMiddleware, fundEscrow);
router.patch('/:id/release', authMiddleware, releaseEscrow);
router.patch('/:id/refund',  authMiddleware, refundEscrow);

module.exports = router;
