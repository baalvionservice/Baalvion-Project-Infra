'use strict';
const router = require('express').Router();
const { authMiddleware, requireOrgType } = require('../middleware/authMiddleware');
const {
    listCases, getCase, createCase, updateCase, clearCase, escalateCase,
} = require('../controller/complianceController');

router.get('/',                 authMiddleware, listCases);
router.get('/:id',              authMiddleware, getCase);
router.post('/',                authMiddleware, createCase);
router.put('/:id',              authMiddleware, updateCase);
router.patch('/:id',            authMiddleware, updateCase);
// Clearing or escalating a compliance case is the compliance agency's own adjudication.
router.patch('/:id/clear',      authMiddleware, requireOrgType('compliance_agency'), clearCase);
router.patch('/:id/escalate',   authMiddleware, requireOrgType('compliance_agency'), escalateCase);

module.exports = router;
