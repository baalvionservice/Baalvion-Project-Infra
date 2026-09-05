'use strict';
// Underwriters + binders (migration 071), mounted at /v1/insurance_underwriters.
//
// PLATFORM operators only. A binder grants capacity on someone else's balance sheet,
// so org-scoped roles (admin/owner/super_admin) must NOT be able to create or amend
// one — that is the same distinction requireVerified draws for the KYC gate.
const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const c = require('../controller/underwriterController');

const platformAdmin = requireRole('platform_admin', 'platform_security_admin', 'super_admin');

router.get('/meta/adapters', authMiddleware, c.adapters);

// The broker's OWN professional indemnity — the platform is the insured here, not
// the seller. Readable by any authenticated operator; only platform admins record it.
router.get('/indemnity', authMiddleware, c.listIndemnity);
router.post('/indemnity', authMiddleware, platformAdmin, c.createIndemnity);
router.patch('/indemnity/:id', authMiddleware, platformAdmin, c.updateIndemnity);
router.get('/', authMiddleware, c.list);
router.get('/:id', authMiddleware, c.get);
router.post('/', authMiddleware, platformAdmin, c.create);
router.patch('/:id', authMiddleware, platformAdmin, c.update);
router.post('/:id/policies/:policyId/confirm', authMiddleware, platformAdmin, c.confirmPolicy);

module.exports = router;
