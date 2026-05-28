'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/verificationController');

router.get('/', authMiddleware, ctrl.getVerification);
router.post('/', authMiddleware, ctrl.submitVerification);
router.post('/approve', authMiddleware, ctrl.approveVerification);
router.post('/reject', authMiddleware, ctrl.rejectVerification);

module.exports = router;
