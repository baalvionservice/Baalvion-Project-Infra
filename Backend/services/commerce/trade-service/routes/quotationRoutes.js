'use strict';
const router = require('express').Router();
const { authMiddleware, requireOrgType } = require('../middleware/authMiddleware');
const {
    listQuotations, getQuotation, createQuotation, createQuotationsBatch, updateQuotation,
    acceptQuotation, rejectQuotation, counterQuotation,
} = require('../controller/quotationController');

// A seller responds to an RFQ with a quote; a buyer decides whether to accept it. counterQuotation
// is left open to either side — a counter-offer can legitimately come from whoever just received one.
router.get('/',      authMiddleware, listQuotations);
router.get('/:id',   authMiddleware, getQuotation);
router.post('/',     authMiddleware, requireOrgType('seller'), createQuotation);
router.post('/batch', authMiddleware, requireOrgType('seller'), createQuotationsBatch);
router.patch('/:id', authMiddleware, requireOrgType('seller'), updateQuotation);
router.patch('/:id/accept',  authMiddleware, requireOrgType('buyer'), acceptQuotation);
router.patch('/:id/reject',  authMiddleware, requireOrgType('buyer'), rejectQuotation);
router.patch('/:id/counter', authMiddleware, counterQuotation);

module.exports = router;
