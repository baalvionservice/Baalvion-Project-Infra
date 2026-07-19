'use strict';
const { Router } = require('express');
const ctrl = require('../controller/publicController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = Router();

// Public read-only APIs — no authentication REQUIRED, but content/list routes accept an
// optional Bearer so the premium-content gate (service/publicService.js + entitlementClient.js)
// knows who's asking. Previously these had zero auth middleware, so req.auth was always
// undefined — same prerequisite gap fixed for imperialpedia-service's article routes.
// /public/:websiteSlug/...
router.get('/:websiteSlug', ctrl.getWebsiteInfo);
router.get('/:websiteSlug/content', optionalAuth, ctrl.listContent);
router.get('/:websiteSlug/content/:slug', optionalAuth, ctrl.getContent);
// Token-gated draft preview for the admin CMS live-preview iframe — see contentController.getPreviewToken.
router.get('/:websiteSlug/content/:slug/preview', ctrl.getPreviewContent);
router.get('/:websiteSlug/categories/:categorySlug', ctrl.getCategory);
router.get('/:websiteSlug/authors', ctrl.listAuthors);
router.get('/:websiteSlug/authors/:slug', ctrl.getAuthor);

module.exports = router;
