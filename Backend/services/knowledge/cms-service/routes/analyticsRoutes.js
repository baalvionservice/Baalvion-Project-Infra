'use strict';
const { Router } = require('express');
const ctrl = require('../controller/analyticsController');
const { loadCmsRole, requireCmsRole } = require('../middleware/cmsAccess');
const { validateQuery } = require('../middleware/validate');
const { reportQuerySchema } = require('../validators/analyticsSchemas');

// Mounted at /cms/websites/:websiteId/analytics — receives websiteId from parent.
// loadCmsRole normalises a slug in :websiteId to the canonical UUID and verifies
// membership (or platform bypass) before any handler reads tenant data.
const router = Router({ mergeParams: true });

const viewer = [loadCmsRole, requireCmsRole('cms_viewer')];
const admin = [loadCmsRole, requireCmsRole('cms_admin')];

router.get('/overview', ...viewer, validateQuery(reportQuerySchema), ctrl.overview);
router.get('/timeseries', ...viewer, validateQuery(reportQuerySchema), ctrl.timeseries);
router.get('/breakdown', ...viewer, validateQuery(reportQuerySchema), ctrl.breakdown);
router.get('/realtime', ...viewer, validateQuery(reportQuerySchema), ctrl.realtime);

// Generic per-module site totals (ecommerce/users/security/marketing/…).
router.get('/totals', ...viewer, validateQuery(reportQuerySchema), ctrl.moduleTotals);
// Infrastructure snapshot (queue depths + ingest volume + partitions).
router.get('/infra', ...admin, ctrl.infra);

// SEO module: Core Web Vitals (first-party) + provider (GSC) metrics.
router.get('/seo/vitals', ...viewer, validateQuery(reportQuerySchema), ctrl.seoVitals);
router.get('/providers/:provider/totals', ...viewer, ctrl.providerTotals);
router.get('/providers/:provider/breakdown', ...viewer, validateQuery(reportQuerySchema), ctrl.providerBreakdown);

router.get('/providers', ...viewer, ctrl.providers);
router.get('/providers/state', ...viewer, ctrl.providerState);

// Reconciliation anomalies + realtime SSE stream.
router.get('/anomalies', ...viewer, validateQuery(reportQuerySchema), ctrl.anomalies);
router.get('/realtime/stream', ...viewer, ctrl.realtimeStream);

// Management (cms_admin): trigger a provider sync + inspect queue health.
router.post('/providers/:provider/sync', ...admin, ctrl.triggerSync);
router.get('/health', ...admin, ctrl.health);

module.exports = router;
