'use strict';
const { Router } = require('express');
const svc = require('../service/profileService');
const v = require('../validators/profile');
const { authMiddleware, decodeEmailFromRequest } = require('../middleware/authMiddleware');
const { requirePerm } = require('../middleware/staffAccess');
const { rememberContact } = require('../middleware/rememberContact');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const router = Router();
const authMw = [authMiddleware, rememberContact];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
router.param('id', (req, res, next, id) => (UUID.test(id) ? next() : next(new AppError('NOT_FOUND', 'Not found', 404))));

const parse = (schema, body) => {
    const r = schema.safeParse(body || {});
    if (!r.success) {
        const issue = r.error.issues[0];
        throw new AppError('VALIDATION_ERROR', `${issue.path.join('.') || 'body'}: ${issue.message}`, 422);
    }
    return r.data;
};
const h = (fn, status) => async (req, res, next) => {
    try { return sendSuccess(req, res, await fn(req), status); } catch (err) { return next(err); }
};
const uid = (req) => req.auth.userId;
const label = (req) => { const e = decodeEmailFromRequest(req); return e ? e.slice(0, 120) : null; };

router.get('/me/profile', authMw, h((req) => svc.getMine(uid(req))));
router.put('/me/profile', authMw, h((req) => svc.saveMine(uid(req), parse(v.profileSchema, req.body))));

router.get('/access-requests/mine', authMw, h((req) => svc.myRequests(uid(req))));
router.post('/access-requests', authMw, h((req) => svc.createRequest(uid(req), label(req), parse(v.requestSchema, req.body)), 201));
router.post('/access-requests/:id/withdraw', authMw, h((req) => svc.withdraw(uid(req), req.params.id)));

const admin = [...authMw, requirePerm('staff.manage')];
router.get('/admin/access-requests', ...admin, h((req) => svc.adminList(req.query.status)));
router.post('/admin/access-requests/:id/decide', ...admin, h((req) => svc.decide(uid(req), req.params.id, parse(v.decisionSchema, req.body))));

module.exports = router;
