'use strict';
// Identity Verification — mounted at /v1/identity_verifications (Phase 2 Trust/
// Verification/Compliance Foundation, Step 2).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/identityVerificationController');

router.get('/me', authMiddleware, ctrl.getMyIdentityVerification);
router.get('/', authMiddleware, ctrl.listIdentityVerifications);
router.post('/', authMiddleware, ctrl.submitIdentityVerification);
router.get('/:id', authMiddleware, ctrl.getIdentityVerification);
router.patch('/:id/liveness', authMiddleware, ctrl.setLivenessResult);
router.patch('/:id/approve', authMiddleware, ctrl.approveIdentityVerification);
router.patch('/:id/reject', authMiddleware, ctrl.rejectIdentityVerification);

module.exports = router;
