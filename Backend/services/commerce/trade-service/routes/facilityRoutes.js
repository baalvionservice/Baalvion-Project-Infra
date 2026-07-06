'use strict';
// Factory & Warehouse Verification — mounted at /v1/facilities (Phase 2, Step 7).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/facilityController');

router.get('/', authMiddleware, ctrl.listFacilities);
router.post('/', authMiddleware, ctrl.createFacility);
router.post('/:id/inspection/request', authMiddleware, ctrl.requestInspection);
router.patch('/:id/inspection/result', authMiddleware, ctrl.setInspectionResult);
router.patch('/:id/approve', authMiddleware, ctrl.approveFacility);
router.patch('/:id/reject', authMiddleware, ctrl.rejectFacility);

module.exports = router;
