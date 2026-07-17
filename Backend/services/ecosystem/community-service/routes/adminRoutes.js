'use strict';
const { Router } = require('express');
const ctrl = require('../controller/adminController');
const { authMiddleware, requireCommunityRole, requirePlatformAdmin } = require('../middleware/authMiddleware');

const router = Router();

router.post('/admin/communities/:slug/members/:userId', authMiddleware, requireCommunityRole('admin'), ctrl.setMember);
router.delete('/admin/communities/:slug/members/:userId', authMiddleware, requireCommunityRole('admin'), ctrl.revokeMember);
router.get('/admin/communities/:slug/moderation-logs', authMiddleware, requireCommunityRole('moderator'), ctrl.moderationLogs);

// Cross-community admin console (admin.baalvion.com's central oversight view) — every
// community's queue in one place, platform-admin only.
router.get('/admin/join-requests', authMiddleware, requirePlatformAdmin, ctrl.listAllPendingJoinRequests);
router.post('/admin/join-requests/:requestId/decide', authMiddleware, requirePlatformAdmin, ctrl.decideAnyJoinRequest);
router.get('/admin/moderation-logs', authMiddleware, requirePlatformAdmin, ctrl.allModerationLogs);

module.exports = router;
