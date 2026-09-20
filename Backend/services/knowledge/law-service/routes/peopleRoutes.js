'use strict';
const router = require('express').Router();
const ctrl = require('../controller/peopleController');

// Public, unauthenticated reads of published profiles only.
router.get('/',              ctrl.listPublished);
router.get('/hidden',        ctrl.hiddenSlugs);
router.get('/photos/:id',    ctrl.getPhoto);
router.get('/:slug',         ctrl.getPublished);

module.exports = router;
