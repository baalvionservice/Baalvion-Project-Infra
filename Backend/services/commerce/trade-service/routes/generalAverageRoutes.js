'use strict';
// General Average (York-Antwerp) — the shipowner's declaration for a voyage and the
// per-cargo-interest contributions apportioned from it. Declaring GA, adjusting the
// figures and settling money all require an org admin; reads are tenant-scoped in
// the controller.
const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const c = require('../controller/generalAverageController');

const gaAdmin = requireRole('admin', 'owner', 'super_admin');

router.get('/', authMiddleware, c.list);
router.post('/', authMiddleware, gaAdmin, c.declare);
router.get('/:id', authMiddleware, c.get);
router.patch('/:id', authMiddleware, gaAdmin, c.update);
router.post('/:id/apportion', authMiddleware, gaAdmin, c.runApportionment);
router.post('/:id/secure', authMiddleware, gaAdmin, c.markSecured);
router.post('/:id/settle', authMiddleware, gaAdmin, c.markSettled);
router.post('/:id/close', authMiddleware, gaAdmin, c.close);

router.post('/:id/contributions', authMiddleware, gaAdmin, c.addContribution);
router.post('/:id/contributions/:contributionId/secure', authMiddleware, c.secureContribution);
router.post('/:id/contributions/:contributionId/settle', authMiddleware, gaAdmin, c.settleContribution);

module.exports = router;
