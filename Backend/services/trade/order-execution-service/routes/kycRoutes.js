'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { tenant, requireTenant } = require('../middleware/tenant');
const c = require('../controller/kycController');

// auth establishes req.auth BEFORE tenant resolves the tenant context (mirrors orderRoutes).
router.use(authMiddleware, tenant);

router.post('/verifications', requireTenant, c.startVerification);
router.get('/verifications/:subjectRef', requireTenant, c.getStatus);

module.exports = router;
