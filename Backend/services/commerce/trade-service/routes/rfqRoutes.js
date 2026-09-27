'use strict';
const router = require('express').Router();
const { authMiddleware, requireOrgType } = require('../middleware/authMiddleware');
const {
    listRfqs, getRfq, createRfq, updateRfq, closeRfq, awardRfq,
} = require('../controller/rfqController');

// Requesting for quotes, and picking the winning one, is the buyer's own call.
router.get('/',              listRfqs);
router.get('/:id',           getRfq);
router.post('/',             authMiddleware, requireOrgType('buyer'), createRfq);
router.put('/:id',           authMiddleware, requireOrgType('buyer'), updateRfq);
router.patch('/:id',         authMiddleware, requireOrgType('buyer'), updateRfq);
router.patch('/:id/close',   authMiddleware, requireOrgType('buyer'), closeRfq);
router.patch('/:id/award',   authMiddleware, requireOrgType('buyer'), awardRfq);

module.exports = router;
