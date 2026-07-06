'use strict';
// Tax Verification — mounted at /v1/tax_registrations (Phase 2, Step 4).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/taxRegistrationController');

router.get('/', authMiddleware, ctrl.listTaxRegistrations);
router.post('/', authMiddleware, ctrl.createTaxRegistration);
router.patch('/:id/approve', authMiddleware, ctrl.approveTaxRegistration);
router.patch('/:id/reject', authMiddleware, ctrl.rejectTaxRegistration);

module.exports = router;
