'use strict';
// Company Verification — mounted at /v1/company_verifications (Phase 2, Step 3).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/companyVerificationController');

router.get('/', authMiddleware, ctrl.listCompanyVerifications);
router.post('/:orgId', authMiddleware, ctrl.submitCompanyVerification);
router.get('/:orgId', authMiddleware, ctrl.getCompanyVerification);
router.patch('/:orgId/approve', authMiddleware, ctrl.approveCompanyVerification);
router.patch('/:orgId/reject', authMiddleware, ctrl.rejectCompanyVerification);

module.exports = router;
