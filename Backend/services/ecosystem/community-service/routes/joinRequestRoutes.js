'use strict';
const { Router } = require('express');
const ctrl = require('../controller/joinRequestController');
const { authMiddleware, requireCommunityRole } = require('../middleware/authMiddleware');

const router = Router();

router.get('/communities/:slug/join-requests', authMiddleware, requireCommunityRole('moderator'), ctrl.listJoinRequests);
router.post('/communities/:slug/join-requests/:requestId/decide', authMiddleware, requireCommunityRole('moderator'), ctrl.decideJoinRequest);

module.exports = router;
