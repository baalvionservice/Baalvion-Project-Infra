const express = require('express');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const paymentRoutes = require('./paymentRoutes');
const platformRoutes = require('./platformRoutes');
const adminRoutes = require('./admin/platformAdminRoutes');
const uploadRoutes = require('./uploadRoutes');
const developerRoutes = require('./apiRoutes');
const ssoRoutes = require('./ssoRoutes');
const oauthRoutes = require('./oauthRoutes');
const billingRoutes = require('./billingRoutes');

const router = express.Router();

// Social login (Google / GitHub) — mounted before /auth so the more specific
// /auth/oauth/* prefix is matched first.
router.use('/auth/oauth', oauthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/payment', paymentRoutes);
router.use('/billing', billingRoutes);   // BFF → SDK-native payment-service
router.use('/upload', uploadRoutes);
router.use('/developer', developerRoutes);
router.use('/sso', ssoRoutes);          // public enterprise SSO (SAML/OIDC)
router.use('/', platformRoutes);
router.use('/admin', adminRoutes);

module.exports = router;