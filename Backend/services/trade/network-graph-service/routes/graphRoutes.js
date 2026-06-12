'use strict';
const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { tenant, requireTenant } = require('../middleware/tenant');
const c = require('../controller/graphController');

// F1: auth establishes req.auth BEFORE tenant resolves the tenant context
// (the Cypher templates scope every read by the ALS-derived orgId).
router.use(authMiddleware, tenant);

router.post('/nodes', requireTenant, c.upsertNode);
router.post('/edges', requireTenant, c.createEdge);
router.get('/nodes/:id/neighbors', requireTenant, c.neighbors);
router.get('/paths', requireTenant, c.paths);
router.get('/sanctions/path/:orgId', requireRole('super_admin', 'compliance_officer', 'admin'), c.sanctionPath);
router.post('/query', requireTenant, c.query);

module.exports = router;
