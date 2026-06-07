'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/applicationController');

// Public: a prospective investor submits a request for access.
router.post('/', ctrl.createApplication);

// Staff-only: list, view and review (approve/reject) applications.
router.get('/', authMiddleware, ctrl.listApplications);
router.get('/:id', authMiddleware, ctrl.getApplication);
router.patch('/:id', authMiddleware, ctrl.reviewApplication);

module.exports = router;
