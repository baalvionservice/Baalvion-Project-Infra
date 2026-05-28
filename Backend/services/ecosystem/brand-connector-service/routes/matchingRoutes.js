'use strict';
const { Router } = require('express');
const ctrl = require('../controller/matchingController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/:dealId', authMiddleware, ctrl.getMatches);
router.post('/auto-shortlist', authMiddleware, ctrl.autoShortlist);

module.exports = router;
