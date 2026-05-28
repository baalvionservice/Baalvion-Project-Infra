'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/contactController');

// Contact form is public but sits behind the global rate limiter
router.post('/', ctrl.createSubmission);
router.get('/', authMiddleware, ctrl.listSubmissions);
router.get('/:id', authMiddleware, ctrl.getSubmission);
router.patch('/:id', authMiddleware, ctrl.updateSubmission);

module.exports = router;
