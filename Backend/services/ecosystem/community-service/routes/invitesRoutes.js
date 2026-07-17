'use strict';
const { Router } = require('express');
const ctrl = require('../controller/invitesController');
const { authMiddleware, requireCommunityRole } = require('../middleware/authMiddleware');

const router = Router();

router.post('/communities/:slug/invites', authMiddleware, requireCommunityRole('moderator'), ctrl.createInvite);
router.post('/invites/:token/redeem', authMiddleware, ctrl.redeemInvite);

module.exports = router;
