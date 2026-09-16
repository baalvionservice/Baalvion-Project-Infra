'use strict';
// Investor capital account — commitment, calls, distributions and NAV.
//
// Every route is authenticated and scoped to the CALLER's own commitments inside the service.
// There is no route that returns another investor's position, and none that accepts an investor
// id from the client: the subject is always req.auth/req.user.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/authMiddleware');
const ctrl = require('../controller/capitalController');

router.get('/summary', authMiddleware, ctrl.getSummary);
router.get('/calls', authMiddleware, ctrl.listCalls);
router.get('/distributions', authMiddleware, ctrl.listDistributions);
router.get('/nav-history', authMiddleware, ctrl.listNavHistory);

// ── Operator (IR / finance) ───────────────────────────────────────────────────
const STAFF = ['super_admin', 'owner', 'admin', 'platform_admin', 'compliance'];
router.get('/admin/register', authMiddleware, requireRole(...STAFF), ctrl.getRegister);
router.post('/admin/calls', authMiddleware, requireRole(...STAFF), ctrl.issueCall);
router.post('/admin/allocations/:allocationId/settle', authMiddleware, requireRole(...STAFF), ctrl.settleAllocation);

router.post('/admin/distributions', authMiddleware, requireRole(...STAFF), ctrl.declareDistribution);
router.post('/admin/distributions/:distributionId/pay', authMiddleware, requireRole(...STAFF), ctrl.payDistribution);

module.exports = router;
