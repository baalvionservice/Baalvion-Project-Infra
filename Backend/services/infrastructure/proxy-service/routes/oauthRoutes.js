'use strict';

// Public consumer social login (Google / GitHub). No session required — these routes
// ARE the auth entry point. Mounted at /v1/auth/oauth (reached same-origin via the
// /auth-bff/* reverse proxy). See controller/oauthController.js.
const express = require('express');
const c = require('../controller/oauthController');

const router = express.Router();

router.get('/:provider/start', c.start);
router.get('/:provider/callback', c.callback);

module.exports = router;
