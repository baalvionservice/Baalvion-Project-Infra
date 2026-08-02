'use strict';
const router = require('express').Router();
const ctrl = require('../controller/publicController');
const leadRateLimit = require('../middleware/leadRateLimit');

// UNAUTHENTICATED by design — see controller/publicController.js header comment.
router.post('/lead', leadRateLimit(), ctrl.submitLead);

module.exports = router;
