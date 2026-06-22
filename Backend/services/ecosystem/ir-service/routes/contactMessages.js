'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/contactMessageController');

// Public: anyone can submit an inbound inquiry to Investor Relations.
router.post('/', ctrl.createMessage);

// Staff-only: triage the inbox (list + mark read/archived).
router.get('/', authMiddleware, ctrl.listMessages);
router.patch('/:id', authMiddleware, ctrl.updateMessage);

module.exports = router;
