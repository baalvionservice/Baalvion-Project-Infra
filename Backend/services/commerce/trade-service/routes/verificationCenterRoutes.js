'use strict';
// Verification Center — mounted at /v1/verification_center (Phase 2 Trust/
// Verification/Compliance Foundation).
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/verificationCenterController');

router.get('/:orgId', authMiddleware, ctrl.getVerificationCenter);

module.exports = router;
