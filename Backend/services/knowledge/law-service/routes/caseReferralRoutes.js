'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/caseReferralController');

router.get('/pending-count',      authMiddleware, ctrl.pendingIncomingCount);
router.get('/',                   authMiddleware, ctrl.listReferrals);
router.post('/',                  authMiddleware, ctrl.createReferral);
router.get('/:id',                authMiddleware, ctrl.getReferral);
router.post('/:id/accept',        authMiddleware, ctrl.acceptReferral);
router.post('/:id/decline',       authMiddleware, ctrl.declineReferral);
router.post('/:id/cancel',        authMiddleware, ctrl.cancelReferral);
router.post('/:id/share-case',    authMiddleware, ctrl.shareCase);
router.post('/:id/complete',      authMiddleware, ctrl.completeReferral);

module.exports = router;
