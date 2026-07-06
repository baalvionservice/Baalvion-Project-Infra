'use strict';
// Address Verification — mounted at /v1/verified_addresses (Phase 2, Step 6).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/verifiedAddressController');

router.get('/', authMiddleware, ctrl.listAddresses);
router.post('/', authMiddleware, ctrl.createAddress);
router.post('/:id/evidence', authMiddleware, ctrl.addEvidence);
router.patch('/:id/approve', authMiddleware, ctrl.approveAddress);
router.patch('/:id/reject', authMiddleware, ctrl.rejectAddress);

module.exports = router;
