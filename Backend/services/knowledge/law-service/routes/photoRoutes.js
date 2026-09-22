'use strict';
const router = require('express').Router();
const ctrl = require('../controller/entityPhotosController');

// Public, unauthenticated: active photos only.
router.get('/',     ctrl.listPrimary);
router.get('/entity/:type/:slug', ctrl.listForEntity);
router.get('/:id',  ctrl.getPhoto);

module.exports = router;
