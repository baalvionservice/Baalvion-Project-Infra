'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/rfqController');

router.get('/', authMiddleware, ctrl.listRfqs);
router.post('/', authMiddleware, ctrl.createRfq);
router.get('/:id', authMiddleware, ctrl.getRfq);
router.get('/:id/bids', authMiddleware, ctrl.listBids);
router.post('/:id/bids', authMiddleware, ctrl.submitBid);
router.patch('/:id/bids/:bidId/award', authMiddleware, ctrl.awardBid);
router.patch('/:id/bids/:bidId/reject', authMiddleware, ctrl.rejectBid);

module.exports = router;
