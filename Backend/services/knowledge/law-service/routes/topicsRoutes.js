'use strict';
const router = require('express').Router();
const ctrl = require('../controller/topicsController');

// Public, unauthenticated reads of published topics only.
router.get('/',        ctrl.listPublished);
router.get('/hidden',  ctrl.hiddenSlugs);
router.get('/:slug',   ctrl.getPublished);

module.exports = router;
