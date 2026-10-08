'use strict';
const { Router } = require('express');
const svc = require('../service/sellerTokenService');
const { sendSuccess } = require('../utils/response');
const { requirePlatformAdmin } = require('../middleware/commerceAccess');

const router = Router();
const wrap = (fn, status) => async (req, res, next) => {
    try { return sendSuccess(req, res, await fn(req), status); } catch (err) { return next(err); }
};

router.get('/wallet', wrap((req) => svc.getWallet(req.auth.userId)));
router.post('/admin-chat', wrap((req) => svc.startAdminChat(req.auth.userId), 201));

router.get('/admin-chat/active', wrap((req) => svc.getSellerChat(req.auth.userId, req.query.after)));
router.post('/admin-chat/messages', wrap((req) => svc.sellerSend(req.auth.userId, req.body && req.body.body), 201));

// Platform admin side
router.get('/admin-chat/sessions', requirePlatformAdmin, wrap(() => svc.listChatSessions()));
router.get('/admin-chat/sessions/:id', requirePlatformAdmin, wrap((req) => svc.adminGetSession(req.params.id, req.query.after)));
router.post('/admin-chat/sessions/:id/messages', requirePlatformAdmin, wrap((req) => svc.adminSend(req.auth.userId, req.params.id, req.body && req.body.body), 201));

module.exports = router;
