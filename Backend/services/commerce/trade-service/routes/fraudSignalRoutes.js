'use strict';
// Fraud Detection — mounted at /v1/fraud_signals (Phase 2, Step 11). Admin/
// reviewer-only throughout.
const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const ctrl = require('../controller/fraudSignalController');

router.use(authMiddleware);
router.use(requireRole('admin', 'operator', 'reviewer'));

router.get('/', ctrl.listSignals);
router.post('/scan_user', ctrl.scanUser);
router.patch('/:id/confirm', ctrl.confirmSignal);
router.patch('/:id/dismiss', ctrl.dismissSignal);

module.exports = router;
