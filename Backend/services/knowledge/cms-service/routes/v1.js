'use strict';
const { Router } = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const internalAuth = require('../middleware/internalAuth');
const websiteRoutes = require('./websiteRoutes');
const taxonomyRoutes = require('./taxonomyRoutes');
const contentRoutes = require('./contentRoutes');
const mediaRoutes = require('./mediaRoutes');
const publicRoutes = require('./publicRoutes');
const integrationRoutes = require('./integrationRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const collectRoutes = require('./collectRoutes');
const integrationController = require('../controller/integrationController');

const router = Router();

// Health
router.get('/health', (req, res) => res.json({ status: 'ok', service: 'cms-service', timestamp: new Date().toISOString() }));

// Unified Analytics OpenAPI contract (JSON; public — it is only the API shape).
router.get('/analytics/openapi.json', (req, res) => res.json(require('../openapi/analytics')));

// Public (unauthenticated) content delivery
router.use('/public', publicRoutes);

// Public first-party analytics event beacon (unauthenticated; per-site origin
// allowlisted inside the ingest service). Does no DB work — validate + enqueue.
router.use('/collect', collectRoutes);

// Public first-party tracker script — a site opts in with one <script> tag.
router.get('/collect.js', require('../controller/collectController').script);

// INTERNAL resolver — services fetch a website's live (decrypted) keys here.
router.get('/internal/integrations/:websiteSlug', internalAuth, integrationController.resolve);

// Org-wide integration summary for the dashboard "Website Connections" widget.
router.get('/cms/integrations/summary', authMiddleware, integrationController.summary);

// All CMS management APIs require auth
router.use('/cms/websites', authMiddleware, websiteRoutes);

// Media library (org-scoped, global across the org's websites)
router.use('/cms/media', authMiddleware, mediaRoutes);

// Website-scoped taxonomy, content, and integration/key routes.
// A slug in :websiteId is normalised to the canonical UUID inside loadCmsRole
// (the first handler on each of these sub-routes) — it must run in the same
// route layer as the controller, not at this mount, or Express re-extraction
// would discard it before the mergeParams sub-router runs.
router.use('/cms/websites/:websiteId', authMiddleware, taxonomyRoutes);
router.use('/cms/websites/:websiteId/content', authMiddleware, contentRoutes);
router.use('/cms/websites/:websiteId/integrations', authMiddleware, integrationRoutes);

// Unified Analytics reporting (website-scoped). loadCmsRole inside the sub-router
// normalises the slug + verifies membership, same as the other website-scoped mounts.
router.use('/cms/websites/:websiteId/analytics', authMiddleware, analyticsRoutes);

module.exports = router;
