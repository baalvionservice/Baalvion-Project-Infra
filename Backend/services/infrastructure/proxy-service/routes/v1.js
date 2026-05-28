const express = require('express');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const paymentRoutes = require('./paymentRoutes');
const platformRoutes = require('./platformRoutes');
const adminRoutes = require('./admin/platformAdminRoutes');
const uploadRoutes = require('./uploadRoutes');
const developerRoutes = require('./apiRoutes');
const ssoRoutes = require('./ssoRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/payment', paymentRoutes);
router.use('/upload', uploadRoutes);
router.use('/developer', developerRoutes);
router.use('/sso', ssoRoutes);          // public enterprise SSO (SAML/OIDC)
router.use('/', platformRoutes);
router.use('/admin', adminRoutes);

module.exports = router;