'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/eventController');

// Public read (events calendar is investor-facing); writes require auth.
router.get('/', ctrl.listEvents);
router.post('/', authMiddleware, ctrl.createEvent);
router.get('/:id', ctrl.getEvent);
router.patch('/:id', authMiddleware, ctrl.updateEvent);
router.delete('/:id', authMiddleware, ctrl.deleteEvent);

module.exports = router;
