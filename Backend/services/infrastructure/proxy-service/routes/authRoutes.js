const express = require('express');
const router = express.Router();

const authController = require('../controller/authController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');

router.route('/register').post(validate(schemas.registerSchema), authController.register);
router.route('/login').post(validate(schemas.loginSchema), authController.login);
router.route('/logout').post(authController.logout);
router.route('/refresh').post(authController.refreshToken);
router.route('/forgot-password').post(validate(schemas.forgotPasswordSchema), authController.forgotPassword);
router.route('/reset-password').post(validate(schemas.resetPasswordSchema), authController.resetPassword);
router.route('/verify-email').post(validate(schemas.verifyEmailSchema), authController.verifyEmail);
router.route('/mfa/enable').post(authMiddleware, authController.enableMfa);
router.route('/mfa/verify').post(authMiddleware, validate(schemas.mfaVerifySchema), authController.verifyMfa);
router.route('/mfa/disable').post(authMiddleware, authController.disableMfa);
router.route('/validate-invite').get(authController.validateInvite);
router.route('/accept-invite').post(authController.acceptInvite);

module.exports = router;