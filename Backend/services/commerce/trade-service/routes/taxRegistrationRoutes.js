'use strict';
// Tax Verification — mounted at /v1/tax_registrations (Phase 2, Step 4).
const router = require('express').Router();
const { authMiddleware, requireOrgType } = require('../middleware/authMiddleware');
const ctrl = require('../controller/taxRegistrationController');

router.get('/', authMiddleware, ctrl.listTaxRegistrations);
router.post('/', authMiddleware, ctrl.createTaxRegistration);
// Tax-authority approval decision — governance domain, not the registering org's own call.
router.patch('/:id/approve', authMiddleware, requireOrgType('regulator'), ctrl.approveTaxRegistration);
router.patch('/:id/reject', authMiddleware, requireOrgType('regulator'), ctrl.rejectTaxRegistration);

module.exports = router;
