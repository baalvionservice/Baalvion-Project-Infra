'use strict';
const express = require('express');
const ctrl = require('../controllers/catalogController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Public OpenAPI catalog — readable without auth so a docs site can render specs.
router.get('/public/specs',           asyncHandler(ctrl.publicListSpecs));
router.get('/public/specs/:service',  asyncHandler(ctrl.publicGetSpec));

module.exports = router;
