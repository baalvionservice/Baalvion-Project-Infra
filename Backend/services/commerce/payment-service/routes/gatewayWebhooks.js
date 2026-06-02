'use strict';
const { Router } = require('express');
const ctrl = require('../controllers/gatewayController');

// Provider webhooks — NO JWT. Authenticated by provider signature verification
// inside the handler. Mounted at /v1/gateway/webhooks (before the authed routes).
const router = Router();
router.post('/:provider', ctrl.handleWebhook);

module.exports = router;
