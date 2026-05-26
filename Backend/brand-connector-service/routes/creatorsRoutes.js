'use strict';
const { Router } = require('express');
const ctrl = require('../controller/matchingController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.post('/shortlist', authMiddleware, ctrl.shortlistCreator);
router.get('/shortlisted/:dealId', authMiddleware, ctrl.getShortlisted);

module.exports = router;
