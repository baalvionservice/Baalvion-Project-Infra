'use strict';
const { Router } = require('express');
const ctrl = require('../controller/adminController');
const { authMiddleware, requireCommunityRole, requirePlatformAdmin } = require('../middleware/authMiddleware');

const router = Router();

router.get('/admin/communities/:slug/members', authMiddleware, requireCommunityRole('moderator'), ctrl.listMembers);
router.post('/admin/communities/:slug/members/:userId', authMiddleware, requireCommunityRole('admin'), ctrl.setMember);
router.delete('/admin/communities/:slug/members/:userId', authMiddleware, requireCommunityRole('admin'), ctrl.revokeMember);
router.get('/admin/communities/:slug/moderation-logs', authMiddleware, requireCommunityRole('moderator'), ctrl.moderationLogs);

// Cross-community admin console (admin.baalvion.com's central oversight view) — every
// community's queue in one place, platform-admin only.
router.get('/admin/join-requests', authMiddleware, requirePlatformAdmin, ctrl.listAllPendingJoinRequests);
router.post('/admin/join-requests/:requestId/decide', authMiddleware, requirePlatformAdmin, ctrl.decideAnyJoinRequest);
router.get('/admin/moderation-logs', authMiddleware, requirePlatformAdmin, ctrl.allModerationLogs);

// Reported-content queue — spans every community's NodeBB flags, platform-admin only (same
// tier as the join-request/moderation-log console views above).
router.get('/admin/flags', authMiddleware, requirePlatformAdmin, ctrl.listFlags);
router.post('/admin/flags/:flagId/resolve', authMiddleware, requirePlatformAdmin, ctrl.resolveFlag);

module.exports = router;
