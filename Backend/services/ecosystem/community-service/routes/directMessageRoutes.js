'use strict';
const { Router } = require('express');
const ctrl = require('../controller/directMessageController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();

// Private 1:1 messaging — authenticated only, no community-role gate (unlike chatRoutes.js).
router.post('/messages/conversations', authMiddleware, ctrl.startConversation);
router.get('/messages/conversations', authMiddleware, ctrl.listConversations);
router.get('/messages/conversations/:conversationId/messages', authMiddleware, ctrl.listMessages);
router.post('/messages/conversations/:conversationId/messages', authMiddleware, ctrl.sendMessage);

module.exports = router;
