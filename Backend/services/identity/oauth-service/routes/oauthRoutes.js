'use strict';
const router = require('express').Router();
const ctrl   = require('../controller/oauthController');
const { authMiddleware, extractClientAuth } = require('../middleware/authMiddleware');

// Authorization endpoint — GET shows consent, POST auto-approves (SPA/mobile flows)
router.get('/authorize',  (req, res, next) => {
    // Optionally attach auth if Bearer token present; don't fail if missing
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
        return authMiddleware(req, res, () => ctrl.authorize(req, res, next));
    }
    ctrl.authorize(req, res, next);
});
router.post('/authorize', authMiddleware, ctrl.authorizePost);

// Token endpoint — RFC 6749
router.post('/token', extractClientAuth, ctrl.token);

// Introspection — RFC 7662 (protected: requires client auth in production)
router.post('/introspect', extractClientAuth, ctrl.introspect);

// Revocation — RFC 7009
router.post('/revoke', extractClientAuth, ctrl.revoke);

// UserInfo — OIDC Core
router.get('/userinfo',  authMiddleware, ctrl.userinfo);
router.post('/userinfo', authMiddleware, ctrl.userinfo);

// RP-Initiated Logout — OIDC. Auth is derived from the hub cookie / id_token_hint inside the
// handler (no authMiddleware: browser logout redirects carry no Authorization header).
router.get('/logout',  ctrl.endSession);
router.post('/logout', ctrl.endSession);

module.exports = router;
