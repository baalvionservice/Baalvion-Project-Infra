'use strict';
const router = require('express').Router();
const ctrl = require('../controller/entertainmentController');

// Public, unauthenticated reads of published entertainment entries only.
router.get('/',        ctrl.listPublished);
router.get('/hidden',  ctrl.hiddenSlugs);
router.get('/:slug',   ctrl.getPublished);

module.exports = router;
