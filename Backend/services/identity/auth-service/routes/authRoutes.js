const express = require('express');
const ctrl    = require('../controller/authController');
const { authMiddleware }       = require('../middleware/authMiddleware');
const { registerLimiter, forgotPwLimiter, mfaChallengeLimiter, verifyEmailLimiter, verifyTokenLimiter } = require('../middleware/rateLimiter');
const internalAuth = require('../middleware/internalAuth');

const router = express.Router();

router.post('/register',       registerLimiter,     ctrl.register);
router.post('/login',                               ctrl.login);
router.post('/refresh',                             ctrl.refresh);
router.post('/logout',         authMiddleware,       ctrl.logout);
router.post('/forgot-password', forgotPwLimiter,    ctrl.forgotPassword);
router.post('/reset-password',                      ctrl.resetPassword);
router.get('/verify-email',    verifyEmailLimiter,  ctrl.verifyEmail);
router.post('/verify-email',   verifyEmailLimiter,  ctrl.verifyEmail);
router.post('/verify-token',   verifyTokenLimiter,  ctrl.verifyToken);

// Internal S2S (dual-issue window): an island service mints a canonical token for a user it has
// already authenticated locally. Rate-limited + HMAC-guarded (INTERNAL_SERVICE_SECRET).
router.post('/issue-on-behalf', verifyTokenLimiter, internalAuth, ctrl.issueOnBehalf);
router.get('/validate-invite',                      ctrl.validateInvite);
router.post('/accept-invite',                       ctrl.acceptInvite);

router.get('/me', authMiddleware, ctrl.getMe);
router.patch('/me', authMiddleware, ctrl.updateMe);

router.get('/sessions',              authMiddleware, ctrl.listSessions);
router.delete('/sessions',           authMiddleware, ctrl.revokeAllSessions);
router.delete('/sessions/:sessionId', authMiddleware, ctrl.revokeSession);

router.get('/audit-logs', authMiddleware, ctrl.getAuditLogs);

router.post('/mfa/challenge', mfaChallengeLimiter, ctrl.mfaChallenge);
router.post('/mfa/enable', authMiddleware, ctrl.enableMfa);
router.post('/mfa/verify', authMiddleware, ctrl.verifyMfa);
router.delete('/mfa/disable', authMiddleware, ctrl.disableMfa);

module.exports = router;
