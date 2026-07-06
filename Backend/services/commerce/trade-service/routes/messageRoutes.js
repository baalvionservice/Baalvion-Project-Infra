'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { listMessages, createMessage, markMessageRead } = require('../controller/messageController');

router.get('/',        authMiddleware, listMessages);
router.post('/',       authMiddleware, createMessage);
router.patch('/:id/read', authMiddleware, markMessageRead);

module.exports = router;
