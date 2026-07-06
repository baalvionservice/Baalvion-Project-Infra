'use strict';
const { Router } = require('express');
const ctrl = require('../controller/publicController');

const router = Router();

// Public read-only APIs — no authentication required
// /public/:websiteSlug/...
router.get('/:websiteSlug', ctrl.getWebsiteInfo);
router.get('/:websiteSlug/content', ctrl.listContent);
router.get('/:websiteSlug/content/:slug', ctrl.getContent);
// Token-gated draft preview for the admin CMS live-preview iframe — see contentController.getPreviewToken.
router.get('/:websiteSlug/content/:slug/preview', ctrl.getPreviewContent);
router.get('/:websiteSlug/categories/:categorySlug', ctrl.getCategory);
router.get('/:websiteSlug/authors', ctrl.listAuthors);
router.get('/:websiteSlug/authors/:slug', ctrl.getAuthor);

module.exports = router;
