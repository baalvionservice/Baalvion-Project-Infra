const express = require('express');
const ctrl    = require('../controller/authController');
const oauthCtrl = require('../controller/oauthController');
const { authMiddleware }       = require('../middleware/authMiddleware');
const { registerLimiter, forgotPwLimiter, mfaChallengeLimiter, verifyEmailLimiter, verifyTokenLimiter, otpRequestLimiter, otpVerifyLimiter, emailOtpRequestLimiter, emailOtpVerifyLimiter } = require('../middleware/rateLimiter');
const internalAuth = require('../middleware/internalAuth');

// ---------------------------------------------------------------------------
// IP-based brute-force protection using express-rate-limit (in-memory store,
// Redis-independent so it never fails open when Redis is down).
// These run IN ADDITION to the existing Redis-backed per-credential limiters.
// ---------------------------------------------------------------------------
const rateLimit = require('express-rate-limit');

// POST /auth/login — 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please try again in 15 minutes.' } },
    skipFailedRequests: false,
});

// POST /auth/accept-invite — 20 attempts per hour per IP
const acceptInviteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many invite acceptance attempts. Please try again in an hour.' } },
    skipFailedRequests: false,
});

const router = express.Router();

// Social login (Google / Facebook) — public; the browser is redirected to the provider
// and back. See controller/oauthController.js + service/oauthLogin.js.
router.get('/oauth/:provider/start',    oauthCtrl.start);
router.get('/oauth/:provider/callback', oauthCtrl.callback);

router.post('/register',       registerLimiter,     ctrl.register);
router.post('/login',          loginLimiter,        ctrl.login);

// Passwordless email-OTP login (public). request → emails a code; verify → mints a session.
// Reachable from every frontend via its /auth-bff/* rewrite to auth-service /v1/auth/*.
router.post('/email/otp/request', emailOtpRequestLimiter, ctrl.requestEmailOtp);
router.post('/email/otp/verify',  emailOtpVerifyLimiter,  ctrl.verifyEmailOtp);
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
router.post('/accept-invite',   acceptInviteLimiter, ctrl.acceptInvite);

router.get('/me', authMiddleware, ctrl.getMe);
router.patch('/me', authMiddleware, ctrl.updateMe);

// Phone verification (OTP) — authenticated. authMiddleware runs FIRST so the limiter can key on
// the user id. Reachable from the frontend via the gateway's /auth/svc/* passthrough.
router.post('/phone/otp/request', authMiddleware, otpRequestLimiter, ctrl.requestPhoneOtp);
router.post('/phone/otp/verify',  authMiddleware, otpVerifyLimiter,  ctrl.verifyPhoneOtp);

router.get('/sessions',              authMiddleware, ctrl.listSessions);
router.delete('/sessions',           authMiddleware, ctrl.revokeAllSessions);
router.delete('/sessions/:sessionId', authMiddleware, ctrl.revokeSession);

router.get('/audit-logs', authMiddleware, ctrl.getAuditLogs);

router.post('/mfa/challenge', mfaChallengeLimiter, ctrl.mfaChallenge);
// Force-MFA enrolment (public — keyed by the enrolment challenge token, like /mfa/challenge).
router.post('/mfa/enroll/start', mfaChallengeLimiter, ctrl.enrollMfaStart);
router.post('/mfa/enroll',       mfaChallengeLimiter, ctrl.enrollMfa);
router.post('/mfa/enable', authMiddleware, ctrl.enableMfa);
router.post('/mfa/verify', authMiddleware, ctrl.verifyMfa);
router.delete('/mfa/disable', authMiddleware, ctrl.disableMfa);

module.exports = router;
