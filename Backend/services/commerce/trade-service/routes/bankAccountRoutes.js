'use strict';
// Bank Verification — mounted at /v1/bank_accounts (Phase 2, Step 5).
const router = require('express').Router();
const { authMiddleware, requireOrgType } = require('../middleware/authMiddleware');
const ctrl = require('../controller/bankAccountController');

// Registering your own settlement account is self-service; verifying it is legitimate (KYB) is
// the compliance agency's decision, not the registering org's own — and not "bank" org type
// either, since a bank isn't the one vetting other companies' account details here.
router.get('/', authMiddleware, ctrl.listBankAccounts);
router.post('/', authMiddleware, ctrl.createBankAccount);
router.patch('/:id/approve', authMiddleware, requireOrgType('compliance_agency'), ctrl.approveBankAccount);
router.patch('/:id/reject', authMiddleware, requireOrgType('compliance_agency'), ctrl.rejectBankAccount);
router.delete('/:id', authMiddleware, ctrl.deleteBankAccount);

module.exports = router;
