'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
    listTickets, getTicket, createTicket, addMessage, updateStatus,
} = require('../controller/supportController');

// Support tickets are private per-org data, so every route requires auth.
router.get('/',              authMiddleware, listTickets);
router.get('/:id',           authMiddleware, getTicket);
router.post('/',             authMiddleware, createTicket);
router.post('/:id/messages', authMiddleware, addMessage);
router.patch('/:id/status',  authMiddleware, updateStatus);

module.exports = router;
