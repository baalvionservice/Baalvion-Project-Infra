'use strict';
// Company Stakeholders — mounted at /v1/company_stakeholders (Phase 2, Step 3).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/companyStakeholderController');

router.get('/', authMiddleware, ctrl.listStakeholders);
router.post('/', authMiddleware, ctrl.createStakeholder);
router.patch('/:id/approve', authMiddleware, ctrl.approveStakeholder);
router.patch('/:id/reject', authMiddleware, ctrl.rejectStakeholder);
router.delete('/:id', authMiddleware, ctrl.deleteStakeholder);

module.exports = router;
