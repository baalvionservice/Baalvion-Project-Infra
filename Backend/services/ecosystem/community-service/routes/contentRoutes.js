'use strict';
const { Router } = require('express');
const ctrl = require('../controller/contentController');
const { authMiddleware, optionalAuthMiddleware, requireCommunityRole } = require('../middleware/authMiddleware');

const router = Router();

router.get('/communities/:slug/threads', optionalAuthMiddleware, ctrl.listThreads);
router.get('/communities/:slug/threads/:tid', optionalAuthMiddleware, ctrl.getThread);
router.post('/communities/:slug/threads', authMiddleware, requireCommunityRole('member'), ctrl.createTopic);
router.post('/communities/:slug/threads/:tid/posts', authMiddleware, requireCommunityRole('member'), ctrl.createReply);

module.exports = router;
