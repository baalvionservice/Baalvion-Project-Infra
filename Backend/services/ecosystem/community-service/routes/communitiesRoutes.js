'use strict';
const { Router } = require('express');
const ctrl = require('../controller/communitiesController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');

const router = Router();

// Public, unauthenticated read — this is what Caddy's @community_public carve-out exposes.
router.get('/public/communities', ctrl.listPublicCommunities);

// Auth-optional detail: personalizes with the caller's own membership status when logged in.
router.get('/communities/:slug', optionalAuthMiddleware, ctrl.getCommunity);

router.post('/communities/:slug/join', authMiddleware, ctrl.joinCommunity);

module.exports = router;
