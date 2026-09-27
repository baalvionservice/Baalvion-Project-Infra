'use strict';
// Customs Filing — typed customs entries + HS classify + tariff + 5-country declaration templates.
const router = require('express').Router();
const c = require('../controller/customsController');
const { authMiddleware, requireOrgType } = require('../middleware/authMiddleware');

// tenantContext (mounted globally) only OPTIONALLY scopes a tenant when a valid token happens to
// be present — it explicitly does not reject anonymous callers (see its own comments). Every route
// below previously had no auth check of any kind; authMiddleware is the actual boundary.
router.use(authMiddleware);

// utilities (must precede /:id so 'classify'/'tariff' aren't captured as an :id)
router.post('/classify', c.classify);
router.get('/tariff', c.tariff);

router.get('/', c.list);
router.post('/', c.create);
router.get('/:id/declaration', c.declaration);
router.get('/:id', c.get);
router.patch('/:id', c.patch);
router.post('/:id/submit', c.submit);
// Clearance decisions are the customs authority's own call — a declarant clearing their own
// filing would defeat the point of the check.
router.post('/:id/clear', requireOrgType('customs_authority'), c.clear);
router.post('/:id/hold', requireOrgType('customs_authority'), c.hold);

module.exports = router;
