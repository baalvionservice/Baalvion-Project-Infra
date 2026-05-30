'use strict';
// PUBLIC staff route — invitation acceptance is token-authenticated, so it must
// sit OUTSIDE the bearer-token authMiddleware. Mounted under /v1/staff before
// authMiddleware; non-matching paths fall through to the authenticated router.
const router = require('express').Router();
const ctrl   = require('../controller/staffController');

router.post('/invitations/accept', ctrl.acceptInvitation);

module.exports = router;
