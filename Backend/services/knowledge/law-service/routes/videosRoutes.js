'use strict';
const router = require('express').Router();
const ctrl = require('../controller/videosController');

// Public, unauthenticated reads of published videos and shows only.
router.get('/',       ctrl.hub);
router.get('/:slug',  ctrl.getVideo);

module.exports = router;
