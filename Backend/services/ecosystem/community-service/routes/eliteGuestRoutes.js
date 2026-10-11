'use strict';
const { Router } = require('express');
const svc = require('../service/eliteGuestService');
const v = require('../validators/eliteGuest');
const { authMiddleware, decodeEmailFromRequest } = require('../middleware/authMiddleware');
const { rememberContact } = require('../middleware/rememberContact');
const { resolveTier, can } = require('../middleware/staffAccess');
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
const h = (fn, status) => async (req, res, next) => {
    try { return sendSuccess(req, res, await fn(req), status); } catch (err) { return next(err); }
};
const uid = (req) => req.auth.userId;
const isStaff = async (req) => can(await resolveTier(req), 'content.handle');
const label = (req) => { const e = decodeEmailFromRequest(req); return e ? e.slice(0, 120) : null; };

router.get('/nightlife/elite-host/mine/parties', authMw, h((req) => svc.myParties(uid(req))));
router.get('/nightlife/elite-host/mine/joins', authMw, h((req) => svc.mine(uid(req))));
router.post('/nightlife/elite-host/guests/:id/withdraw', authMw, h((req) => svc.withdraw(uid(req), req.params.id)));
router.post('/nightlife/elite-host/guests/:id/decide', authMw, h(async (req) => svc.decide(uid(req), await isStaff(req), req.params.id, parse(v.decideSchema, req.body).approve)));
router.post('/nightlife/elite-host/:id/join', authMw, h((req) => svc.join(uid(req), label(req), req.params.id, parse(v.joinSchema, req.body)), 201));
router.get('/nightlife/elite-host/:id/guests', authMw, h(async (req) => svc.listForParty(uid(req), await isStaff(req), req.params.id)));

module.exports = router;
