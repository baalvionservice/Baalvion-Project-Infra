'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/applicationController');

// Public: a prospective investor submits a request for access.
router.post('/', ctrl.createApplication);

// Public (read-only): deal-room eligibility for an email. Declared BEFORE '/:id' so it is not
// captured by the authenticated param route.
router.get('/eligibility', ctrl.getEligibility);

// Staff-only: list, view and review (approve/reject) applications.
router.get('/', authMiddleware, ctrl.listApplications);
router.get('/:id', authMiddleware, ctrl.getApplication);
router.patch('/:id', authMiddleware, ctrl.reviewApplication);

module.exports = router;
