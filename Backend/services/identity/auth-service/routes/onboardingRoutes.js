'use strict';
/**
 * @file onboardingRoutes.js
 * @description PUBLIC onboarding intake route. No auth middleware — the applicant
 * has no session yet. Mounted under /v1/auth, so the full path is
 * POST /v1/auth/onboarding-application. It can only create a `pending` org.
 */

const express = require('express');
const ctrl = require('../controller/onboardingController');
const { onboardingLimiter, contactLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/onboarding-application', onboardingLimiter, ctrl.submitApplication);
router.post('/contact-inquiry', contactLimiter, ctrl.submitContactInquiry);

module.exports = router;
