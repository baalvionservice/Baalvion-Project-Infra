'use strict';
const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { tenant, requireTenant } = require('../middleware/tenant');
const c = require('../controller/supplierController');

// F1: auth establishes req.auth BEFORE tenant resolves the tenant context.
router.use(authMiddleware, tenant);

router.get('/suppliers', requireTenant, c.listSuppliers);
router.post('/suppliers', requireTenant, c.createSupplier);
router.get('/suppliers/:id', requireTenant, c.getSupplier);
router.post('/suppliers/:id/transition', requireTenant, c.transition);
router.post('/suppliers/:id/docs', requireTenant, c.addDoc);
router.get('/suppliers/:id/scorecard', requireTenant, c.getScorecard);
router.post('/suppliers/:id/blacklist', requireRole('super_admin', 'admin', 'compliance_officer'), c.blacklist);

module.exports = router;
