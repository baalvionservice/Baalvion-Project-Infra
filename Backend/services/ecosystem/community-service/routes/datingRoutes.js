'use strict';
const { Router } = require('express');
const svc = require('../service/datingService');
const v = require('../validators/dating');
const { authMiddleware, decodeEmailFromRequest } = require('../middleware/authMiddleware');
const { rememberContact } = require('../middleware/rememberContact');
const { requirePerm } = require('../middleware/staffAccess');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const router = Router();
const authMw = [authMiddleware, rememberContact];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
router.param('id', (req, res, next, id) => (UUID.test(id) ? next() : next(new AppError('NOT_FOUND', 'Not found', 404))));
const parse = (schema, body) => {
    const r = schema.safeParse(body || {});
    if (!r.success) throw new AppError('VALIDATION_ERROR', `${r.error.issues[0].path.join('.') || 'body'}: ${r.error.issues[0].message}`, 422);
    return r.data;
};
const h = (fn, status) => async (req, res, next) => { try { return sendSuccess(req, res, await fn(req), status); } catch (err) { return next(err); } };
const uid = (req) => req.auth.userId;
const label = (req) => { const e = decodeEmailFromRequest(req); return e ? e.slice(0, 120) : null; };

router.get('/dating/me', authMw, h((req) => svc.mine(uid(req))));
router.put('/dating/me', authMw, h((req) => svc.saveMine(uid(req), parse(v.profileSchema, req.body))));
router.get('/dating/discover', authMw, h((req) => svc.discover(uid(req), { city: req.query.city, founders: req.query.founders === '1' })));
router.get('/dating/matches', authMw, h((req) => svc.matches(uid(req))));
router.post('/dating/:id/act', authMw, h((req) => svc.act(uid(req), req.params.id, parse(v.actSchema, req.body).action)));
router.post('/dating/:id/report', authMw, h((req) => svc.report(uid(req), label(req), req.params.id, parse(v.reportSchema, req.body).reason), 201));
router.get('/admin/dating', authMw, requirePerm('content.handle'), h((req) => svc.adminList({ status: req.query.status })));
router.post('/admin/dating/:id/hide', authMw, requirePerm('content.handle'), h((req) => { const b = parse(v.hideSchema, req.body); return svc.adminHide(req.params.id, b.hidden, b.reason); }));

module.exports = router;
