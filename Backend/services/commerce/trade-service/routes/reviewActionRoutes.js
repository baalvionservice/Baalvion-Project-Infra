'use strict';
// Manual Review Console — mounted at /v1/review_actions (Phase 2, Step 15).
// Admin/reviewer-only throughout.
const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const ctrl = require('../controller/reviewActionController');

router.use(authMiddleware);
router.use(requireRole('admin', 'operator', 'reviewer'));

router.get('/queue', ctrl.getQueue);
router.get('/', ctrl.getHistory);
router.post('/', ctrl.submitDecision);

module.exports = router;
