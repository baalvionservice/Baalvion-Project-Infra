'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/businessOnboardingController');

// Public: a business submits a complete onboarding application
// (company creation + KYC + IEC/GST/VAT + nested documents).
router.post('/', ctrl.createApplication);

// Staff-only: review queue + approval workflow.
router.get('/', authMiddleware, ctrl.listApplications);
router.get('/:id', authMiddleware, ctrl.getApplication);
router.patch('/:id', authMiddleware, ctrl.reviewApplication);

// Staff-only: per-application document management + verification.
router.get('/:id/documents', authMiddleware, ctrl.listDocuments);
router.post('/:id/documents', authMiddleware, ctrl.addDocument);
router.patch('/:id/documents/:docId', authMiddleware, ctrl.reviewDocument);

module.exports = router;
