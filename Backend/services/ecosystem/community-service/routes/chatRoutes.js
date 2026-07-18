'use strict';
const { Router } = require('express');
const ctrl = require('../controller/chatController');
const { authMiddleware, requireCommunityRole } = require('../middleware/authMiddleware');

const router = Router();

// Live chat is join-gated end to end — unlike forum threads (which allow anonymous reads
// on free communities), both reading and posting here require an active membership, since
// the feature is explicitly "request to join, then chat" rather than a public feed.
router.get('/communities/:slug/chat/messages', authMiddleware, requireCommunityRole('member'), ctrl.listMessages);
router.post('/communities/:slug/chat/messages', authMiddleware, requireCommunityRole('member'), ctrl.postMessage);

module.exports = router;
