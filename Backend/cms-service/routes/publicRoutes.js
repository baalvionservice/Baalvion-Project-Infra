'use strict';
const { Router } = require('express');
const ctrl = require('../controller/publicController');

const router = Router();

// Public read-only APIs — no authentication required
// /public/:websiteSlug/...
router.get('/:websiteSlug', ctrl.getWebsiteInfo);
router.get('/:websiteSlug/content', ctrl.listContent);
router.get('/:websiteSlug/content/:slug', ctrl.getContent);
router.get('/:websiteSlug/categories/:categorySlug', ctrl.getCategory);

module.exports = router;
