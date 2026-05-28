'use strict';
const { Router } = require('express');
const ctrl = require('../controller/proposalsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.listProposals);
router.post('/', authMiddleware, ctrl.createProposal);
router.get('/:id', authMiddleware, ctrl.getProposal);
router.patch('/:id', authMiddleware, ctrl.updateProposal);
router.post('/:id/send', authMiddleware, ctrl.sendProposal);
router.post('/:id/approve', authMiddleware, ctrl.approveProposal);
router.post('/:id/reject', authMiddleware, ctrl.rejectProposal);

module.exports = router;
