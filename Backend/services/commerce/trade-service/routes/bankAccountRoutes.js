'use strict';
// Bank Verification — mounted at /v1/bank_accounts (Phase 2, Step 5).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/bankAccountController');

router.get('/', authMiddleware, ctrl.listBankAccounts);
router.post('/', authMiddleware, ctrl.createBankAccount);
router.patch('/:id/approve', authMiddleware, ctrl.approveBankAccount);
router.patch('/:id/reject', authMiddleware, ctrl.rejectBankAccount);
router.delete('/:id', authMiddleware, ctrl.deleteBankAccount);

module.exports = router;
