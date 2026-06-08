'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { tenant, requireTenant } = require('../middleware/tenant');
const c = require('../controller/inspectionController');

// F1: auth establishes req.auth BEFORE tenant resolves the tenant context.
router.use(authMiddleware, tenant);

router.get('/inspections', requireTenant, c.listInspections);
router.post('/inspections', requireTenant, c.scheduleInspection);
router.get('/inspections/:id', requireTenant, c.getInspection);
router.post('/inspections/:id/start', requireTenant, c.startInspection);
router.post('/inspections/:id/result', requireTenant, c.submitResult);
router.post('/inspections/:id/capa', requireTenant, c.openCapa);

module.exports = router;
