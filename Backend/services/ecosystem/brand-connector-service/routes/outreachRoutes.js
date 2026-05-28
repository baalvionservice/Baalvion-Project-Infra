'use strict';
const { Router } = require('express');
const ctrl = require('../controller/outreachController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/campaigns', authMiddleware, ctrl.listOutreachCampaigns);
router.post('/campaigns', authMiddleware, ctrl.createOutreachCampaign);
router.get('/campaigns/:id', authMiddleware, ctrl.getOutreachCampaign);
router.get('/messages', authMiddleware, ctrl.listMessages);
router.post('/send', authMiddleware, ctrl.sendCampaign);
router.post('/simulate-replies', authMiddleware, ctrl.simulateReplies);
router.post('/follow-up', authMiddleware, ctrl.sendFollowUp);

module.exports = router;
