'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
    listQuotations, getQuotation, createQuotation, updateQuotation,
    acceptQuotation, rejectQuotation, counterQuotation,
} = require('../controller/quotationController');

router.get('/',      authMiddleware, listQuotations);
router.get('/:id',   authMiddleware, getQuotation);
router.post('/',     authMiddleware, createQuotation);
router.patch('/:id', authMiddleware, updateQuotation);
router.patch('/:id/accept',  authMiddleware, acceptQuotation);
router.patch('/:id/reject',  authMiddleware, rejectQuotation);
router.patch('/:id/counter', authMiddleware, counterQuotation);

module.exports = router;
