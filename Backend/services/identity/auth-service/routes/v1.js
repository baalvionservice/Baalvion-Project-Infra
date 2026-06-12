const express = require('express');
const authRoutes = require('./authRoutes');
const teamRoutes = require('./teamRoutes');
const platformRoutes = require('./platformRoutes');
const onboardingRoutes = require('./onboardingRoutes');

const router = express.Router();

// Public onboarding intake is mounted FIRST: it must match before platformRoutes,
// whose router-level authMiddleware would otherwise 401 the unauthenticated applicant.
router.use('/auth', onboardingRoutes); // public onboarding intake (no auth)
router.use('/auth', authRoutes);
router.use('/auth', teamRoutes);
router.use('/auth', platformRoutes);

module.exports = router;
