'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { tenant, requireTenant } = require('../middleware/tenant');
const c = require('../controller/documentController');

// F1: auth establishes req.auth BEFORE tenant resolves the tenant context.
router.use(authMiddleware, tenant);

router.get('/documents', requireTenant, c.listDocuments);
router.post('/documents', requireTenant, c.createDraft);
router.get('/documents/:id', requireTenant, c.getDocument);
router.post('/documents/:id/issue', requireTenant, c.issueDocument);
router.post('/documents/:id/sign', requireTenant, c.signDocument);
router.post('/documents/:id/void', requireTenant, c.voidDocument);
router.get('/orders/:orderId/dossier', requireTenant, c.orderDossier);

module.exports = router;
