'use strict';
// Insurance policies — quote → bind (premium) → active, cancel, expiry sweep.
// Same flaw as insuranceClaimsRoutes: these had no authMiddleware and "relied on tenantContext"
// (which is not authentication). bind charges a premium and cancel reverses a policy, so all
// routes now require authentication; bind/cancel additionally require an org admin.
const router = require('express').Router();
const { authMiddleware, requireRole, requireVerified } = require('../middleware/authMiddleware');
const config = require('../config/appConfig');
const c = require('../controller/insuranceController');

const policyAdmin = requireRole('admin', 'owner', 'super_admin');

// Static paths before '/:id' so 'summary' is not read as a policy id.
router.get('/summary', authMiddleware, c.summary);
router.post('/quote', authMiddleware, c.quote);
router.post('/expire_due', authMiddleware, policyAdmin, c.expirePolicies);

router.get('/', authMiddleware, c.listPolicies);
router.post('/', authMiddleware, c.createPolicy);
router.get('/:id', authMiddleware, c.getPolicy);
// Binding charges a premium against the assured's ledger account, so it is gated on
// the organization actually being verified. Quote and create stay open — neither
// commits money — and CLAIMING is deliberately NOT gated: cover already paid for
// must remain claimable even if a KYC refresh has since lapsed.
router.post('/:id/bind', authMiddleware, requireVerified(config.verification.requiredLevel), policyAdmin, c.bindPolicy);
router.post('/:id/cancel', authMiddleware, policyAdmin, c.cancelPolicy);

module.exports = router;
