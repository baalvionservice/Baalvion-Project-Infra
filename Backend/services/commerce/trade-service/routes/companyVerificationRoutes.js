'use strict';
// Company Verification — mounted at /v1/company_verifications (Phase 2, Step 3).
const router = require('express').Router();
const { authMiddleware, requireOrgType } = require('../middleware/authMiddleware');
const ctrl = require('../controller/companyVerificationController');

router.get('/', authMiddleware, ctrl.listCompanyVerifications);
router.post('/:orgId', authMiddleware, ctrl.submitCompanyVerification);
router.get('/:orgId', authMiddleware, ctrl.getCompanyVerification);
// KYB decision — the compliance agency's review, never the applicant company approving itself.
router.patch('/:orgId/approve', authMiddleware, requireOrgType('compliance_agency'), ctrl.approveCompanyVerification);
router.patch('/:orgId/reject', authMiddleware, requireOrgType('compliance_agency'), ctrl.rejectCompanyVerification);

module.exports = router;
