'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/authController');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', authMiddleware, ctrl.me);

// Refresh-token sessions. /refresh + /logout accept the token via httpOnly
// cookie or body, so they do NOT require a (possibly expired) access token.
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);
router.get('/sessions', authMiddleware, ctrl.listSessions);
router.delete('/sessions', authMiddleware, ctrl.revokeAllSessions);
router.delete('/sessions/:id', authMiddleware, ctrl.revokeSession);

// MFA (TOTP) lifecycle — all require an authenticated session.
router.post('/mfa/enroll', authMiddleware, ctrl.enrollMfa);
router.post('/mfa/verify', authMiddleware, ctrl.verifyMfa);
router.post('/mfa/disable', authMiddleware, ctrl.disableMfa);

module.exports = router;
