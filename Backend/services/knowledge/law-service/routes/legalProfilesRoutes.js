'use strict';
const router = require('express').Router();
const ctrl = require('../controller/legalProfilesController');

// Public, unauthenticated reads of published case and court profiles only.
router.get('/hidden',        ctrl.hiddenSlugs);
router.get('/courts',        ctrl.listCourts);
router.get('/courts/:slug',  ctrl.getCourt);
router.get('/cases',         ctrl.listCases);
router.get('/cases/:slug',   ctrl.getCase);

module.exports = router;
