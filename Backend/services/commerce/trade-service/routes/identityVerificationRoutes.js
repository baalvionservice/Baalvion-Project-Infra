'use strict';
// Identity Verification — mounted at /v1/identity_verifications (Phase 2 Trust/
// Verification/Compliance Foundation, Step 2).
const router = require('express').Router();
const { authMiddleware, requireOrgType } = require('../middleware/authMiddleware');
const ctrl = require('../controller/identityVerificationController');

router.get('/me', authMiddleware, ctrl.getMyIdentityVerification);
router.get('/', authMiddleware, ctrl.listIdentityVerifications);
router.post('/', authMiddleware, ctrl.submitIdentityVerification);
router.get('/:id', authMiddleware, ctrl.getIdentityVerification);
router.patch('/:id/liveness', authMiddleware, ctrl.setLivenessResult);
// The KYC decision is the compliance agency's own review — never the applicant approving themself.
router.patch('/:id/approve', authMiddleware, requireOrgType('compliance_agency'), ctrl.approveIdentityVerification);
router.patch('/:id/reject', authMiddleware, requireOrgType('compliance_agency'), ctrl.rejectIdentityVerification);

module.exports = router;
