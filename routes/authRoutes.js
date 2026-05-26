'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/authController');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', authMiddleware, ctrl.me);

// MFA (TOTP) lifecycle — all require an authenticated session.
router.post('/mfa/enroll', authMiddleware, ctrl.enrollMfa);
router.post('/mfa/verify', authMiddleware, ctrl.verifyMfa);
router.post('/mfa/disable', authMiddleware, ctrl.disableMfa);

module.exports = router;
