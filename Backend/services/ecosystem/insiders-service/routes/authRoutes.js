'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateBody, schemas } = require('../middleware/validate');
const ctrl = require('../controller/authController');

// Validation middleware mirrors the controllers' existing manual presence checks
// (presence + type only). It is intentionally no stricter than current behavior;
// the controllers retain their own checks (password length, normalization, etc.).
router.post('/register', validateBody(schemas.registerSchema), ctrl.register);
router.post('/login', validateBody(schemas.loginSchema), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', validateBody(schemas.resetPasswordSchema), ctrl.resetPassword);
router.get('/me', authMiddleware, ctrl.me);
router.post('/update-password', authMiddleware, ctrl.updatePassword);

module.exports = router;
