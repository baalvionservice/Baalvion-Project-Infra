'use strict';
// Digital Bill of Lading — typed e-B/L with a title-transfer/surrender lifecycle.
const router = require('express').Router();
const blc = require('../controller/billOfLadingController');
const { authMiddleware, requireOrgType } = require('../middleware/authMiddleware');

// tenantContext (mounted globally) only optionally scopes a tenant when a valid token is
// present — it never rejects anonymous callers. Every route below had no auth check at all.
router.use(authMiddleware);

router.get('/',             blc.list);
router.get('/:id',          blc.get);
router.post('/',            blc.create);
// Issuing/signing/releasing/cancelling the carrier's own document is the carrier's (logistics
// provider's) call. transfer/surrender move title between buyer and seller per the trade's
// Incoterms and are left open to either — restricting those to one org type would break the
// actual endorsement flow.
router.post('/:id/issue',     requireOrgType('logistics_provider'), blc.issue);
router.post('/:id/transfer',  blc.transfer);
router.post('/:id/surrender', blc.surrender);
router.post('/:id/release',   requireOrgType('logistics_provider'), blc.release);
router.post('/:id/sign',      requireOrgType('logistics_provider'), blc.sign);
router.post('/:id/cancel',    requireOrgType('logistics_provider'), blc.cancel);

module.exports = router;
