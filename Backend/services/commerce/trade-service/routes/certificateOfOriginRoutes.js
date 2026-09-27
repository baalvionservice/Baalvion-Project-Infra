'use strict';
// Certificate of Origin — typed CoO with issue → chamber-certify lifecycle + e-stamp.
const router = require('express').Router();
const coo = require('../controller/certificateOfOriginController');
const { authMiddleware, requireOrgType } = require('../middleware/authMiddleware');

// tenantContext (mounted globally) only optionally scopes a tenant when a valid token is
// present — it never rejects anonymous callers. Every route below had no auth check at all.
router.use(authMiddleware);

router.get('/',              coo.list);
router.get('/:id/document',  coo.document);
router.get('/:id',           coo.get);
router.post('/',             coo.create);
router.post('/:id/issue',    coo.issue);
router.post('/:id/submit',   coo.submit);
// The chamber-of-commerce certification decision is compliance_agency's own call.
router.post('/:id/certify',  requireOrgType('compliance_agency'), coo.certify);
router.post('/:id/reject',   requireOrgType('compliance_agency'), coo.reject);

module.exports = router;
