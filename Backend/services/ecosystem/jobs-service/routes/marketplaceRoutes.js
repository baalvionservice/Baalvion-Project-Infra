'use strict';
const { Router } = require('express');
const ctrl = require('../controller/marketplaceController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();

// Per-route auth, not router.use — this router carries both public browsing and
// authenticated bidding, and a blanket gate would take the shop window down with it.

// ─── Public ──────────────────────────────────────────────────────────────────
router.get('/marketplace/projects', ctrl.listPublicProjects);
router.get('/marketplace/facets', ctrl.listProjectFacets);
router.get('/marketplace/projects/:slug', ctrl.getPublicProject);

// ─── Bidding (signed-in candidates) ──────────────────────────────────────────
router.post('/marketplace/projects/:id/apply', authMiddleware, ctrl.applyToProject);
router.get('/me/project-applications', authMiddleware, ctrl.listMyProjectApplications);

// ─── Poster side ─────────────────────────────────────────────────────────────
router.post('/projects/:id/publish', authMiddleware, ctrl.publishProject);
router.post('/projects/:id/unpublish', authMiddleware, ctrl.unpublishProject);
router.get('/projects/:id/applications', authMiddleware, ctrl.listProjectApplications);
router.patch('/project-applications/:id/status', authMiddleware, ctrl.updateProjectApplicationStatus);

module.exports = router;
