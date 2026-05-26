'use strict';

/**
 * Developer / programmatic API surface (mounted at /v1/developer and
 * /api/v1/developer). Authenticated by API key (x-api-key or Bearer bvl_…) or
 * JWT, then org-validated, scope/permission-gated, rate-limited per plan, and
 * usage-attributed.
 */

const express = require('express');
const authenticateRequest = require('../middleware/authenticateRequest');
const requireOrganizationAccess = require('../middleware/requireOrganizationAccess');
const { requireScopes, requirePermissions } = require('../middleware/authorize');
const { rateLimit } = require('../middleware/rateLimitMiddleware');
const { attributeUsage } = require('../service/usageAttribution');
const controller = require('../controller/developerController');

const router = express.Router();

// Every developer route: authenticate → validate org → plan rate limit → attribute.
router.use(authenticateRequest, requireOrganizationAccess, rateLimit({ scope: 'developer' }), attributeUsage('api.request'));

router.get('/me', controller.me);
router.get('/usage', requirePermissions(['usage:view']), controller.usage);

router.route('/proxy/sessions')
  .get(requirePermissions(['usage:view']), controller.listProxySessions)
  .post(requireScopes(['proxy:connect']), controller.createProxySession);
router.delete('/proxy/sessions/:id', requireScopes(['proxy:connect']), controller.closeProxySession);

router.post('/keys/:id/rotate', requirePermissions(['apikey:create']), controller.rotateApiKey);

module.exports = router;
