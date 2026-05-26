'use strict';
const { Router } = require('express');
const ctrl = require('../controller/onboardingController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.getOnboarding);
router.post('/save', authMiddleware, ctrl.saveStep);
router.post('/complete', authMiddleware, ctrl.completeOnboarding);

module.exports = router;
