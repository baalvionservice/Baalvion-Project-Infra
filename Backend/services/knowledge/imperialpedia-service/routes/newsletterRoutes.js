'use strict';
const router = require('express').Router();
const ctrl = require('../controller/newsletterController');

// Public — no auth. Rate-limited globally by the app-level IP limiter (see
// middleware/rateLimit.js), same as every other public endpoint on this service.
router.post('/subscribe', ctrl.subscribe);
router.post('/unsubscribe', ctrl.unsubscribe);

module.exports = router;
